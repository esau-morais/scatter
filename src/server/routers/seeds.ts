import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { seeds, transformations } from "@/db/schema";
import { protectedProcedure, router } from "../trpc";

export const seedsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [seed] = await db
        .insert(seeds)
        .values({
          userId: ctx.session.user.id,
          title: input.title,
          content: input.content,
        })
        .returning();

      return seed;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const userSeeds = await db
      .select()
      .from(seeds)
      .where(eq(seeds.userId, ctx.session.user.id))
      .orderBy(desc(seeds.createdAt));

    if (userSeeds.length === 0) {
      return [];
    }

    const seedIds = userSeeds.map((s) => s.id);
    const userTransformations = await db
      .select()
      .from(transformations)
      .where(inArray(transformations.seedId, seedIds));

    const results = userSeeds.map((seed) => {
      return {
        seed: seed,
        transformations: userTransformations.filter(
          (t) => t.seedId === seed.id,
        ),
      };
    });

    return results;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const [seed] = await db
        .select()
        .from(seeds)
        .where(eq(seeds.id, input.id));

      if (!seed || seed.userId !== ctx.session.user.id) {
        throw new Error("Seed not found");
      }

      return seed;
    }),

  getWithTransformations: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const [seed] = await db
        .select()
        .from(seeds)
        .where(eq(seeds.id, input.id));

      if (!seed || seed.userId !== ctx.session.user.id) {
        throw new Error("Seed not found");
      }

      const seedTransformations = await db
        .select()
        .from(transformations)
        .where(eq(transformations.seedId, seed.id));

      return {
        seed,
        transformations: seedTransformations,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [seed] = await db
        .select()
        .from(seeds)
        .where(eq(seeds.id, input.id));

      if (!seed || seed.userId !== ctx.session.user.id) {
        throw new Error("Seed not found");
      }

      await db.delete(seeds).where(eq(seeds.id, input.id));

      return { success: true };
    }),
});
