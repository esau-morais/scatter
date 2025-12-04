import { google } from "@ai-sdk/google";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { seeds, transformations, usageStats } from "@/db/schema";
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

export const transformationsRouter = router({
  getDashboardData: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [user] = await db
      .select({ plan: users.plan })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const stats = await getCurrentMonthUsage(userId);
    const limit = USAGE_LIMITS[user.plan];
    const successRate =
      stats.transformationsCreated > 0
        ? Math.round(
            (stats.transformationsPosted / stats.transformationsCreated) * 100,
          )
        : 0;

    return {
      seedsCreated: stats.seedsCreated,
      totalTransformations: stats.transformationsCreated,
      successRate,
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

      const [user] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, userId));

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
      const [seed] = await db
        .select()
        .from(seeds)
        .where(eq(seeds.id, input.seedId));

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

      if (!transformation || transformation.seed.userId !== ctx.session.user.id) {
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

      const [user] = await db
        .select({ plan: users.plan })
        .from(users)
        .where(eq(users.id, userId));

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
        const [result] = await tx
          .update(transformations)
          .set({
            content: generated.content,
            postedAt: null,
          })
          .where(eq(transformations.id, id))
          .returning();

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
});
