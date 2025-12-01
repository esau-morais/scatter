import { google } from "@ai-sdk/google";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { and, count, eq, gte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { seeds, transformations } from "@/db/schema";
import { user } from "@/lib/auth/auth-schema";
import { protectedProcedure, router } from "../trpc";

const platformEnum = z.enum(["x", "linkedin", "tiktok", "blog"]);

const limits: Record<string, number | null> = {
  free: 10,
  creator: 100,
  pro: null, // unlimited
};

export const transformationsRouter = router({
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // Get user plan
    const [currentUser] = await db
      .select({ plan: user.plan })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!currentUser) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // Count transformations for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [usageResult] = await db
      .select({ count: count() })
      .from(transformations)
      .innerJoin(seeds, eq(transformations.seedId, seeds.id))
      .where(
        and(
          eq(seeds.userId, userId),
          gte(transformations.createdAt, startOfMonth),
        ),
      );

    const currentUsage = usageResult?.count ?? 0;
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { content, platforms } = input;
      const userId = ctx.session.user.id;

      // Get user plan
      const [currentUser] = await db
        .select({ plan: user.plan })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!currentUser) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Check usage limits (count transformations for current month)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [usageResult] = await db
        .select({ count: count() })
        .from(transformations)
        .innerJoin(seeds, eq(transformations.seedId, seeds.id))
        .where(
          and(
            eq(seeds.userId, userId),
            gte(transformations.createdAt, startOfMonth),
          ),
        );

      const currentUsage = usageResult?.count ?? 0;

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
          
          Follow these platform-specific guidelines strictly:
          - x: Write a punchy, engaging, and slightly contrarian thread (5-10 tweets). Use thread numbering (1/, 2/, ...). Add a strong hook in the first tweet. Use hashtags sparingly.
          - linkedin: Write a professional, story-driven post (1500-3000 characters). Use paragraph breaks for readability. Include a clear Call to Action (CTA) at the end.
          - tiktok: Write a casual, 30-60 second video script. Use markers like [HOOK], [B-ROLL], [VISUAL], and [CTA] to suggest shots and on-screen text.
          - blog: Write an SEO-friendly introduction (150-200 words) for a blog post. It should be engaging and clearly state what the reader will learn.
          
          Core Idea: "${content}"
          
          Generate content ONLY for the following platforms: ${platforms.join(
            ", ",
          )}.`,
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

      const [updated] = await db
        .update(transformations)
        .set({
          postedAt: input.posted ? new Date() : null,
        })
        .where(eq(transformations.id, input.id))
        .returning();

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
});
