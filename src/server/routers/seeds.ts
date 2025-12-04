import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { seeds } from "@/db/schema";
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
    const results = await db.query.seeds.findMany({
      where: eq(seeds.userId, ctx.session.user.id),
      orderBy: desc(seeds.createdAt),
      with: {
        transformations: true,
      },
    });

    return results.map(({ transformations, ...seed }) => ({
      seed,
      transformations,
    }));
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
      const seed = await db.query.seeds.findFirst({
        where: and(
          eq(seeds.id, input.id),
          eq(seeds.userId, ctx.session.user.id),
        ),
        with: {
          transformations: true,
        },
      });

      if (!seed) {
        throw new Error("Seed not found");
      }

      return {
        seed,
        transformations: seed.transformations,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await db
        .delete(seeds)
        .where(
          and(eq(seeds.id, input.id), eq(seeds.userId, ctx.session.user.id)),
        )
        .returning();

      if (!deleted) {
        throw new Error("Seed not found");
      }

      return { success: true };
    }),
});
