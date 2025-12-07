import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { seeds, transformations } from "@/db/schema";
import { users } from "@/lib/auth/auth-schema";
import { protectedProcedure, router } from "../trpc";

const platformEnum = z.enum(["x", "linkedin", "tiktok", "blog"]);

export const onboardingRouter = router({
  complete: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    await db
      .update(users)
      .set({ onboardingCompleted: true })
      .where(eq(users.id, userId));

    return { success: true };
  }),

  saveDemo: protectedProcedure
    .input(
      z.object({
        seed: z.string().min(10),
        platforms: z.array(platformEnum).min(1),
        transformations: z.array(
          z.object({
            platform: platformEnum,
            content: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const {
        seed: seedContent,
        platforms,
        transformations: demoTransformations,
      } = input;

      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          plan: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const result = await db.transaction(async (tx) => {
        const [seed] = await tx
          .insert(seeds)
          .values({
            userId,
            content: seedContent,
            title: seedContent.substring(0, 50),
          })
          .returning();

        const transformationsToInsert = demoTransformations
          .filter((t) => platforms.includes(t.platform))
          .map((t) => ({
            seedId: seed.id,
            platform: t.platform,
            content: t.content,
          }));

        if (transformationsToInsert.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No valid transformations to save",
          });
        }

        const savedTransformations = await tx
          .insert(transformations)
          .values(transformationsToInsert)
          .returning();

        await tx
          .update(users)
          .set({ onboardingCompleted: true })
          .where(eq(users.id, userId));

        return { seed, transformations: savedTransformations };
      });

      return result;
    }),

  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        onboardingCompleted: true,
      },
    });

    return {
      completed: user?.onboardingCompleted ?? false,
    };
  }),
});
