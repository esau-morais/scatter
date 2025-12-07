import { google } from "@ai-sdk/google";
import { TRPCError } from "@trpc/server";
import { generateObject } from "ai";
import { z } from "zod";
import { checkGuestRateLimit, getClientIP } from "../lib/rate-limit";
import { publicProcedure, router } from "../trpc";

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

export const guestRouter = router({
  generate: publicProcedure
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

      const clientIP = getClientIP(ctx.headers);

      const allowed = await checkGuestRateLimit(clientIP);
      if (!allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message:
            "You've used your free try! Sign up for 10 free transformations per month, or try again in 15 minutes.",
        });
      }

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

      return {
        transformations: generated.transformations
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
