import { google } from "@ai-sdk/google";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { and, count, eq, gte, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { seeds, transformations, usageStats } from "@/db/schema";
import { users } from "@/lib/auth/auth-schema";
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

const limits: Record<string, number | null> = {
  free: 10,
  creator: 100,
  pro: null, // unlimited
};

export const transformationsRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [stats] = await db
      .select()
      .from(usageStats)
      .where(and(eq(usageStats.userId, userId), eq(usageStats.month, startOfMonth)));

    const totalTransformations = stats?.transformationsCreated ?? 0;
    const postedTransformations = stats?.transformationsPosted ?? 0;
    const successRate =
      totalTransformations > 0
        ? Math.round((postedTransformations / totalTransformations) * 100)
        : 0;

    return {
      seedsCreated: stats?.seedsCreated ?? 0,
      totalTransformations,
      successRate,
    };
  }),

  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [currentUser] = await db
      .select({
        plan: users.plan,
        usageCount: users.usageCount,
        usageResetAt: users.usageResetAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Reset usage if we're in a new month
    let currentUsage = currentUser.usageCount;
    if (currentUser.usageResetAt < startOfMonth) {
      await db
        .update(users)
        .set({ usageCount: 0, usageResetAt: startOfMonth })
        .where(eq(users.id, userId));
      currentUsage = 0;
    }

    const limit = limits[currentUser.plan];

    return {
      currentUsage,
      limit,
      remaining: limit !== null ? Math.max(0, limit - currentUsage) : null,
      plan: currentUser.plan,
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

      const [currentUser] = await db
        .select({
          plan: users.plan,
          usageCount: users.usageCount,
          usageResetAt: users.usageResetAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!currentUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Reset usage if we're in a new month
      let currentUsage = currentUser.usageCount;
      if (currentUser.usageResetAt < startOfMonth) {
        await db
          .update(users)
          .set({ usageCount: 0, usageResetAt: startOfMonth })
          .where(eq(users.id, userId));
        currentUsage = 0;
      }

      const limit = limits[currentUser.plan];
      // Check if adding new transformations would exceed limit
      if (limit !== null && currentUsage + platforms.length > limit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Usage limit would be exceeded. You've used ${currentUsage}/${limit} transformations this month. Upgrade your plan to continue.`,
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
          .update(users)
          .set({ usageCount: currentUsage + savedTransformations.length })
          .where(eq(users.id, userId));

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        await tx
          .insert(usageStats)
          .values({
            userId,
            month: startOfMonth,
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

      const [transformation] = await db
        .select({
          transformation: transformations,
          seed: seeds,
        })
        .from(transformations)
        .innerJoin(seeds, eq(transformations.seedId, seeds.id))
        .where(eq(transformations.id, input.id));

      if (
        !transformation ||
        transformation.seed.userId !== userId
      ) {
        throw new Error("Transformation not found");
      }

      const wasPosted = !!transformation.transformation.postedAt;
      const willBePosted = input.posted;

      const [updated] = await db
        .update(transformations)
        .set({
          postedAt: willBePosted ? new Date() : null,
        })
        .where(eq(transformations.id, input.id))
        .returning();

      if (wasPosted !== willBePosted) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const delta = willBePosted ? 1 : -1;

        await db
          .insert(usageStats)
          .values({
            userId,
            month: startOfMonth,
            seedsCreated: 0,
            transformationsCreated: 0,
            transformationsPosted: delta,
          })
          .onConflictDoUpdate({
            target: [usageStats.userId, usageStats.month],
            set: {
              transformationsPosted: sql`${usageStats.transformationsPosted} + ${delta}`,
            },
          });
      }

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [transformation] = await db
        .select({
          transformation: transformations,
          seed: seeds,
        })
        .from(transformations)
        .innerJoin(seeds, eq(transformations.seedId, seeds.id))
        .where(eq(transformations.id, input.id));

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

      const [existing] = await db
        .select({
          transformation: transformations,
          seed: seeds,
        })
        .from(transformations)
        .innerJoin(seeds, eq(transformations.seedId, seeds.id))
        .where(eq(transformations.id, id));

      if (!existing || existing.seed.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transformation not found",
        });
      }

      const { seed, transformation } = existing;
      const platform = transformation.platform;
      const wasPosted = !!transformation.postedAt;

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

      // Update the transformation with new content
      const [updated] = await db
        .update(transformations)
        .set({
          content: generated.content,
          postedAt: null, // Reset posted status on regenerate
        })
        .where(eq(transformations.id, id))
        .returning();

      // If the transformation was previously posted, decrement the usage stats
      if (wasPosted) {
        const userId = ctx.session.user.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        await db
          .insert(usageStats)
          .values({
            userId,
            month: startOfMonth,
            seedsCreated: 0,
            transformationsCreated: 0,
            transformationsPosted: -1,
          })
          .onConflictDoUpdate({
            target: [usageStats.userId, usageStats.month],
            set: {
              transformationsPosted: sql`${usageStats.transformationsPosted} - 1`,
            },
          });
      }

      return updated;
    }),
});
