import { google } from "@ai-sdk/google";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { and, desc, eq, inArray, max, not, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  seeds,
  transformations,
  transformationVersions,
  usageStats,
} from "@/db/schema";
import { users } from "@/lib/auth/auth-schema";
import {
  getCurrentMonthUsage,
  getStartOfMonth,
  USAGE_LIMITS,
} from "../lib/usage";
import { protectedProcedure, router } from "../trpc";

const platformEnum = z.enum(["x", "linkedin", "tiktok", "blog"]);
const toneEnum = z.enum(["professional", "casual", "witty", "educational"]);
const lengthEnum = z.enum(["short", "medium", "long"]);

const toneDescriptions: Record<string, string> = {
  professional: "Use a formal, polished tone. Be authoritative and credible.",
  casual: "Use a friendly, conversational tone. Be approachable and relatable.",
  witty: "Use a clever, humorous tone. Add personality and memorable hooks.",
  educational:
    "Use an informative, clear tone. Focus on teaching and explaining.",
};

const lengthDescriptions: Record<string, string> = {
  short: "Keep content concise and punchy. Focus on key points only.",
  medium: "Balance depth with readability. Cover main points with some detail.",
  long: "Be thorough and detailed. Provide comprehensive coverage of the topic.",
};

const MAX_VERSIONS = 10;

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[number];

async function getMaxVersion(
  transformationId: string,
  tx: Transaction,
): Promise<number> {
  const result = await tx
    .select({
      max: max(transformationVersions.versionNumber),
    })
    .from(transformationVersions)
    .where(eq(transformationVersions.transformationId, transformationId));

  return result[0]?.max ?? 0;
}

async function saveVersion(
  transformationId: string,
  content: string,
  source: "ai_generated" | "manual_edit",
  tx: Transaction,
): Promise<void> {
  const nextVersion = (await getMaxVersion(transformationId, tx)) + 1;

  await tx.insert(transformationVersions).values({
    transformationId,
    content,
    versionNumber: nextVersion,
    source,
  });
}

async function deleteOldVersions(
  transformationId: string,
  maxVersions: number,
  tx: Transaction,
): Promise<void> {
  const versionsToKeep = await tx
    .select({ id: transformationVersions.id })
    .from(transformationVersions)
    .where(eq(transformationVersions.transformationId, transformationId))
    .orderBy(desc(transformationVersions.versionNumber))
    .limit(maxVersions);

  if (versionsToKeep.length >= maxVersions) {
    const keepIds = versionsToKeep.map((v) => v.id);
    await tx
      .delete(transformationVersions)
      .where(
        and(
          eq(transformationVersions.transformationId, transformationId),
          not(inArray(transformationVersions.id, keepIds)),
        ),
      );
  }
}

export const transformationsRouter = router({
  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [user, stats] = await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { plan: true },
      }),
      getCurrentMonthUsage(userId),
    ]);

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const limit = USAGE_LIMITS[user.plan];
    // Display: paid + free usage combined
    const totalSeeds = stats.seedsCreated + stats.freeSeedsCreated;
    const totalTransformations =
      stats.transformationsCreated + stats.freeTransformationsCreated;
    const successRate =
      totalTransformations > 0
        ? Math.round((stats.transformationsPosted / totalTransformations) * 100)
        : 0;

    return {
      seedsCreated: totalSeeds,
      totalTransformations,
      successRate,
      // Quota: paid usage only
      currentUsage: stats.transformationsCreated,
      limit,
      remaining:
        limit !== null
          ? Math.max(0, limit - stats.transformationsCreated)
          : null,
      plan: user.plan,
    };
  }),

  generate: protectedProcedure
    .input(
      z.object({
        content: z.string().min(10, {
          message: "Content must be at least 10 characters long.",
        }),
        platforms: z.array(platformEnum).min(1, {
          message: "Please select at least one platform.",
        }),
        tone: toneEnum.default("professional"),
        length: lengthEnum.default("medium"),
        persona: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { content, platforms, tone, length, persona } = input;
      const userId = ctx.session.user.id;

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          plan: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const stats = await getCurrentMonthUsage(userId);
      const limit = USAGE_LIMITS[user.plan];

      if (
        limit !== null &&
        stats.transformationsCreated + platforms.length > limit
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Usage limit would be exceeded. You've used ${stats.transformationsCreated}/${limit} transformations this month. Upgrade your plan to continue.`,
        });
      }

      const result = await db.transaction(async (tx) => {
        const [seed] = await tx
          .insert(seeds)
          .values({
            userId,
            content,
            title: content.substring(0, 50), // Auto-generate a title
          })
          .returning();

        const toneInstruction = toneDescriptions[tone];
        const lengthInstruction = lengthDescriptions[length];
        const personaInstruction = persona
          ? `Write from the perspective of ${persona}. Adopt their voice, expertise, and viewpoint.`
          : "";

        const lengthModifiers: Record<
          string,
          { x: string; linkedin: string; tiktok: string; blog: string }
        > = {
          short: {
            x: "3-5 tweets",
            linkedin: "800-1200 characters",
            tiktok: "15-30 second script",
            blog: "80-120 words",
          },
          medium: {
            x: "5-8 tweets",
            linkedin: "1500-2500 characters",
            tiktok: "30-45 second script",
            blog: "150-200 words",
          },
          long: {
            x: "8-12 tweets",
            linkedin: "2500-3000 characters",
            tiktok: "45-60 second script",
            blog: "200-300 words",
          },
        };

        const lengths = lengthModifiers[length];

        const { object: generated } = await generateObject({
          model: google("gemini-2.5-flash-preview-09-2025"),
          schema: z.object({
            transformations: z.array(
              z.object({
                platform: platformEnum,
                content: z.string(),
              }),
            ),
          }),
          prompt: `You are Scatter, an expert content repurposing assistant for creators.
          A user has provided a "core idea". Your task is to transform this core idea into high-fidelity, ready-to-post drafts for the specified platforms.

          ## Style Guidelines
          ${toneInstruction}
          ${lengthInstruction}
          ${personaInstruction}

          ## Platform-Specific Guidelines
          Follow these platform-specific guidelines strictly:
          - x: Write a punchy, engaging thread (${lengths.x}). Use thread numbering (1/, 2/, ...). Add a strong hook in the first tweet. Use hashtags sparingly.
          - linkedin: Write a story-driven post (${lengths.linkedin}). Use paragraph breaks for readability. Include a clear Call to Action (CTA) at the end.
          - tiktok: Write a ${lengths.tiktok} video script. Use markers like [HOOK], [B-ROLL], [VISUAL], and [CTA] to suggest shots and on-screen text.
          - blog: Write an SEO-friendly introduction (${lengths.blog}) for a blog post. It should be engaging and clearly state what the reader will learn.

          ## Core Idea
          "${content}"

          Generate content ONLY for the following platforms: ${platforms.join(", ")}.`,
        });

        const transformationsToInsert = generated.transformations
          .filter((t) => platforms.includes(t.platform))
          .map((t) => ({
            seedId: seed.id,
            platform: t.platform,
            content: t.content,
          }));

        if (transformationsToInsert.length === 0) {
          throw new Error(
            "AI failed to generate content for the requested platforms.",
          );
        }

        const savedTransformations = await tx
          .insert(transformations)
          .values(transformationsToInsert)
          .returning();

        for (const transformation of savedTransformations) {
          await saveVersion(
            transformation.id,
            transformation.content,
            "ai_generated",
            tx,
          );
        }

        await tx
          .insert(usageStats)
          .values({
            userId,
            month: getStartOfMonth(),
            seedsCreated: 1,
            transformationsCreated: savedTransformations.length,
            transformationsPosted: 0,
          })
          .onConflictDoUpdate({
            target: [usageStats.userId, usageStats.month],
            set: {
              seedsCreated: sql`${usageStats.seedsCreated} + 1`,
              transformationsCreated: sql`${usageStats.transformationsCreated} + ${savedTransformations.length}`,
            },
          });

        return { seed, transformations: savedTransformations };
      });

      return result;
    }),

  create: protectedProcedure
    .input(
      z.object({
        seedId: z.uuid(),
        platform: platformEnum,
        content: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const seed = await db.query.seeds.findFirst({
        where: eq(seeds.id, input.seedId),
      });

      if (!seed || seed.userId !== ctx.session.user.id) {
        throw new Error("Seed not found");
      }

      const [transformation] = await db
        .insert(transformations)
        .values({
          seedId: input.seedId,
          platform: input.platform,
          content: input.content,
        })
        .returning();

      return transformation;
    }),

  markAsPosted: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        posted: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const transformation = await db.query.transformations.findFirst({
        where: eq(transformations.id, input.id),
        with: {
          seed: true,
        },
      });

      if (!transformation || transformation.seed.userId !== userId) {
        throw new Error("Transformation not found");
      }

      const wasPosted = !!transformation.postedAt;
      const willBePosted = input.posted;

      const updated = await db.transaction(async (tx) => {
        const [result] = await tx
          .update(transformations)
          .set({
            postedAt: willBePosted ? new Date() : null,
          })
          .where(eq(transformations.id, input.id))
          .returning();

        if (wasPosted !== willBePosted) {
          const delta = willBePosted ? 1 : -1;
          const month = getStartOfMonth();

          await tx
            .insert(usageStats)
            .values({
              userId,
              month,
              seedsCreated: 0,
              transformationsCreated: 0,
              transformationsPosted: delta,
            })
            .onConflictDoUpdate({
              target: [usageStats.userId, usageStats.month],
              set: {
                transformationsPosted: sql`GREATEST(0, ${usageStats.transformationsPosted} + ${delta})`,
              },
            });
        }

        return result;
      });

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const transformation = await db.query.transformations.findFirst({
        where: eq(transformations.id, input.id),
        with: {
          seed: true,
        },
      });

      if (
        !transformation ||
        transformation.seed.userId !== ctx.session.user.id
      ) {
        throw new Error("Transformation not found");
      }

      await db.delete(transformations).where(eq(transformations.id, input.id));

      return { success: true };
    }),

  regenerate: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        tone: toneEnum.default("professional"),
        length: lengthEnum.default("medium"),
        persona: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, tone, length, persona } = input;
      const userId = ctx.session.user.id;

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          plan: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const stats = await getCurrentMonthUsage(userId);
      const limit = USAGE_LIMITS[user.plan];

      if (limit !== null && stats.transformationsCreated >= limit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Usage limit reached. You've used ${stats.transformationsCreated}/${limit} transformations this month. Upgrade your plan to continue.`,
        });
      }

      const existing = await db.query.transformations.findFirst({
        where: eq(transformations.id, id),
        with: {
          seed: true,
        },
      });

      if (!existing || existing.seed.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transformation not found",
        });
      }

      const { seed } = existing;
      const platform = existing.platform;
      const wasPosted = !!existing.postedAt;

      const toneInstruction = toneDescriptions[tone];
      const lengthInstruction = lengthDescriptions[length];
      const personaInstruction = persona
        ? `Write from the perspective of ${persona}. Adopt their voice, expertise, and viewpoint.`
        : "";

      const lengthModifiers: Record<
        string,
        { x: string; linkedin: string; tiktok: string; blog: string }
      > = {
        short: {
          x: "3-5 tweets",
          linkedin: "800-1200 characters",
          tiktok: "15-30 second script",
          blog: "80-120 words",
        },
        medium: {
          x: "5-8 tweets",
          linkedin: "1500-2500 characters",
          tiktok: "30-45 second script",
          blog: "150-200 words",
        },
        long: {
          x: "8-12 tweets",
          linkedin: "2500-3000 characters",
          tiktok: "45-60 second script",
          blog: "200-300 words",
        },
      };

      const lengths = lengthModifiers[length];

      const platformGuide: Record<string, string> = {
        x: `Write a punchy, engaging thread (${lengths.x}). Use thread numbering (1/, 2/, ...). Add a strong hook in the first tweet. Use hashtags sparingly.`,
        linkedin: `Write a story-driven post (${lengths.linkedin}). Use paragraph breaks for readability. Include a clear Call to Action (CTA) at the end.`,
        tiktok: `Write a ${lengths.tiktok} video script. Use markers like [HOOK], [B-ROLL], [VISUAL], and [CTA] to suggest shots and on-screen text.`,
        blog: `Write an SEO-friendly introduction (${lengths.blog}) for a blog post. It should be engaging and clearly state what the reader will learn.`,
      };

      const { object: generated } = await generateObject({
        model: google("gemini-2.5-flash-preview-09-2025"),
        schema: z.object({
          content: z.string(),
        }),
        prompt: `You are Scatter, an expert content repurposing assistant for creators.
          Regenerate content for the "${platform}" platform based on the core idea below.

          ## Style Guidelines
          ${toneInstruction}
          ${lengthInstruction}
          ${personaInstruction}
          
          ## Platform Guidelines
          ${platformGuide[platform]}
          
          ## Core Idea
          "${seed.content}"
          
          Generate fresh, unique content that's different from before but maintains the same core message.`,
      });

      const updated = await db.transaction(async (tx) => {
        await saveVersion(
          id,
          existing.content,
          existing.editedAt ? "manual_edit" : "ai_generated",
          tx,
        );

        const [result] = await tx
          .update(transformations)
          .set({
            content: generated.content,
            postedAt: null,
            editedAt: null,
          })
          .where(eq(transformations.id, id))
          .returning();

        await deleteOldVersions(id, MAX_VERSIONS, tx);

        const month = getStartOfMonth();
        const postedDelta = wasPosted ? -1 : 0;

        await tx
          .insert(usageStats)
          .values({
            userId,
            month,
            seedsCreated: 0,
            transformationsCreated: 1,
            transformationsPosted: postedDelta,
          })
          .onConflictDoUpdate({
            target: [usageStats.userId, usageStats.month],
            set: {
              transformationsCreated: sql`${usageStats.transformationsCreated} + 1`,
              transformationsPosted: sql`GREATEST(0, ${usageStats.transformationsPosted} + ${postedDelta})`,
            },
          });

        return result;
      });

      return updated;
    }),

  updateContent: protectedProcedure
    .input(
      z.object({
        id: z.uuid(),
        content: z.string().min(1, {
          message: "Content cannot be empty.",
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, content } = input;
      const userId = ctx.session.user.id;

      const existing = await db.query.transformations.findFirst({
        where: eq(transformations.id, id),
        with: {
          seed: true,
        },
      });

      if (!existing || existing.seed.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transformation not found",
        });
      }

      const wasPosted = !!existing.postedAt;

      const updated = await db.transaction(async (tx) => {
        await saveVersion(
          id,
          existing.content,
          existing.editedAt ? "manual_edit" : "ai_generated",
          tx,
        );

        const [result] = await tx
          .update(transformations)
          .set({
            content,
            editedAt: new Date(),
            postedAt: null,
          })
          .where(eq(transformations.id, id))
          .returning();

        await deleteOldVersions(id, MAX_VERSIONS, tx);

        if (wasPosted) {
          const month = getStartOfMonth();
          await tx
            .insert(usageStats)
            .values({
              userId,
              month,
              seedsCreated: 0,
              transformationsCreated: 0,
              transformationsPosted: 0,
            })
            .onConflictDoUpdate({
              target: [usageStats.userId, usageStats.month],
              set: {
                transformationsPosted: sql`GREATEST(0, ${usageStats.transformationsPosted} - 1)`,
              },
            });
        }

        return result;
      });

      return updated;
    }),

  getVersionHistory: protectedProcedure
    .input(z.object({ transformationId: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const transformation = await db.query.transformations.findFirst({
        where: eq(transformations.id, input.transformationId),
        with: {
          seed: true,
        },
      });

      if (!transformation || transformation.seed.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transformation not found",
        });
      }

      const versions = await db
        .select()
        .from(transformationVersions)
        .where(
          eq(transformationVersions.transformationId, input.transformationId),
        )
        .orderBy(desc(transformationVersions.versionNumber));

      return {
        current: transformation,
        versions,
      };
    }),

  restoreVersion: protectedProcedure
    .input(
      z.object({
        transformationId: z.uuid(),
        versionNumber: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { transformationId, versionNumber } = input;
      const userId = ctx.session.user.id;

      const transformation = await db.query.transformations.findFirst({
        where: eq(transformations.id, transformationId),
        with: {
          seed: true,
        },
      });

      if (!transformation || transformation.seed.userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transformation not found",
        });
      }

      const version = await db.query.transformationVersions.findFirst({
        where: and(
          eq(transformationVersions.transformationId, transformationId),
          eq(transformationVersions.versionNumber, versionNumber),
        ),
      });

      if (!version) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Version not found",
        });
      }

      const wasPosted = !!transformation.postedAt;

      const updated = await db.transaction(async (tx) => {
        await saveVersion(
          transformationId,
          transformation.content,
          transformation.editedAt ? "manual_edit" : "ai_generated",
          tx,
        );

        const [result] = await tx
          .update(transformations)
          .set({
            content: version.content,
            editedAt: new Date(),
            postedAt: null,
          })
          .where(eq(transformations.id, transformationId))
          .returning();

        await deleteOldVersions(transformationId, MAX_VERSIONS, tx);

        if (wasPosted) {
          const month = getStartOfMonth();
          await tx
            .insert(usageStats)
            .values({
              userId,
              month,
              seedsCreated: 0,
              transformationsCreated: 0,
              transformationsPosted: 0,
            })
            .onConflictDoUpdate({
              target: [usageStats.userId, usageStats.month],
              set: {
                transformationsPosted: sql`GREATEST(0, ${usageStats.transformationsPosted} - 1)`,
              },
            });
        }

        return result;
      });

      return updated;
    }),
});
