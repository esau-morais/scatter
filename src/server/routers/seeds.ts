import { TRPCError } from "@trpc/server";
import * as Effect from "effect/Effect";
import { z } from "zod";
import {
  createSeedEffect,
  deleteSeedEffect,
  findSeedEffect,
  findSeedWithTransformationsEffect,
  listSeedsEffect,
} from "../lib/database";
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
      return Effect.runPromise(
        createSeedEffect({
          userId: ctx.session.user.id,
          title: input.title,
          content: input.content,
        }),
      );
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const results = await Effect.runPromise(
      listSeedsEffect(ctx.session.user.id),
    );

    return results.map(({ transformations, ...seed }) => ({
      seed,
      transformations,
    }));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      return Effect.runPromise(
        findSeedEffect(input.id, ctx.session.user.id).pipe(
          Effect.catchTag("NotFoundError", () =>
            Effect.fail(
              new TRPCError({ code: "NOT_FOUND", message: "Seed not found" }),
            ),
          ),
        ),
      );
    }),

  getWithTransformations: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .query(async ({ ctx, input }) => {
      const seed = await Effect.runPromise(
        findSeedWithTransformationsEffect(input.id, ctx.session.user.id).pipe(
          Effect.catchTag("NotFoundError", () =>
            Effect.fail(
              new TRPCError({ code: "NOT_FOUND", message: "Seed not found" }),
            ),
          ),
        ),
      );

      return {
        seed,
        transformations: seed.transformations,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ ctx, input }) => {
      return Effect.runPromise(
        deleteSeedEffect(input.id, ctx.session.user.id).pipe(
          Effect.catchTag("NotFoundError", () =>
            Effect.fail(
              new TRPCError({ code: "NOT_FOUND", message: "Seed not found" }),
            ),
          ),
        ),
      );
    }),
});
