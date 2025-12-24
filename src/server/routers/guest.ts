import { TRPCError } from "@trpc/server";
import * as Effect from "effect/Effect";
import { z } from "zod";
import { generateTransformationsEffect, platformEnum } from "../lib/ai";
import {
  promptSafeStringSchema,
  sanitizeUserInput,
} from "../lib/prompt-security";
import { checkGuestRateLimit } from "../lib/rate-limit";
import { publicProcedure, router } from "../trpc";

const toneEnum = z.enum(["professional", "casual", "witty", "educational"]);
const lengthEnum = z.enum(["short", "medium", "long"]);

export const guestRouter = router({
  generate: publicProcedure
    .input(
      z.object({
        content: promptSafeStringSchema({
          kind: "content",
          min: 10,
          minMessage: "Content must be at least 10 characters long.",
        }),
        platforms: z.array(platformEnum).min(1, {
          message: "Please select at least one platform.",
        }),
        tone: toneEnum.default("professional"),
        length: lengthEnum.default("medium"),
        persona: promptSafeStringSchema({
          kind: "persona",
          max: 200,
          maxMessage: "Persona must be 200 characters or less.",
        }).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { content, platforms, tone, length, persona } = input;

      const sanitizedContent = sanitizeUserInput(content);
      const sanitizedPersona = persona ? sanitizeUserInput(persona) : undefined;

      const allowed = await checkGuestRateLimit(ctx.fingerprint);
      if (!allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "You've used your free try! Sign up for 10 free transformations per month, or try again tomorrow.",
        });
      }

      const generated = await Effect.runPromise(
        generateTransformationsEffect(
          {
            content: sanitizedContent,
            platforms,
            tone,
            length,
            persona: sanitizedPersona,
          },
          sanitizedContent,
          sanitizedPersona,
        ).pipe(
          Effect.catchTag("AIGenerationError", (error) =>
            Effect.fail(
              new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to generate content. Please try again.",
                cause: error.cause,
              }),
            ),
          ),
          Effect.catchTag("AIValidationError", (error) =>
            Effect.fail(
              new TRPCError({
                code: "BAD_REQUEST",
                message: error.message,
              }),
            ),
          ),
        ),
      );

      return {
        transformations: generated
          .filter((t) => platforms.includes(t.platform))
          .map((t, index) => ({
            id: `guest-${Date.now()}-${index}`,
            platform: t.platform,
            content: t.content,
            seedId: null,
            postedAt: null,
            createdAt: new Date(),
          })),
        content,
      };
    }),
});
