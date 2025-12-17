import { TRPCError } from "@trpc/server";
import { z } from "zod";

const ZERO_WIDTH_CHARS = /[\u200B-\u200D\u2060\uFEFF]/g;
const BASE64_TOKEN = /^[A-Za-z0-9+/]{20,}={0,2}$/;
const HEX_TOKEN = /^[0-9a-fA-F]{20,}$/;

const INJECTION_PATTERNS = [
  /ignore\s+(previous|above|prior|all)\s+(instructions?|commands?|prompts?)/i,
  /disregard\s+(previous|above|all)/i,
  /forget\s+(previous|everything|all)/i,
  /override\s+(instruction|setting)/i,
  /new\s+instruction/i,
  // Role markers (anchor to start-of-line to reduce false positives)
  /^\s*(system|assistant|user)\s*:/im,
  /\[SYSTEM\]|\[\/SYSTEM\]/i,
  // ChatML tags
  /<\|im_start\|>|<\|im_end\|>/i,
  // Delimiter abuse
  /#{4,}|={4,}|-{4,}/,
  // XML tag injection for our prompt structure
  /<\/?user_input>|<\/?user_persona>/i,
];

const OUTPUT_LEAK_PATTERNS = [
  /you are scatter/i,
  /content repurposing assistant/i,
  /platform-specific guidelines/i,
  /system\s+prompt/i,
  /developer\s+message/i,
  /hidden\s+instruction/i,
];

type PromptSafeKind = "content" | "persona";

export function sanitizeUserInput(input: string): string {
  return input.replace(ZERO_WIDTH_CHARS, "").replace(/\n{3,}/g, "\n\n").trim();
}

export function detectInjectionAttempt(text: string): boolean {
  const cleaned = text.replace(ZERO_WIDTH_CHARS, "");

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(cleaned)) return true;
  }

  // Check for encoded payloads (hex/base64) in any long "token"
  for (const token of cleaned.split(/\s+/)) {
    if (token.length < 20) continue;

    if (HEX_TOKEN.test(token)) {
      try {
        const decoded = Buffer.from(token, "hex").toString("utf8");
        for (const pattern of INJECTION_PATTERNS) {
          if (pattern.test(decoded)) return true;
        }
      } catch {
        // ignore
      }
    }

    if (BASE64_TOKEN.test(token)) {
      try {
        const decoded = Buffer.from(token, "base64").toString("utf8");
        for (const pattern of INJECTION_PATTERNS) {
          if (pattern.test(decoded)) return true;
        }
      } catch {
        // ignore
      }
    }
  }

  return false;
}

export function promptSafeStringSchema(opts: {
  kind: PromptSafeKind;
  min?: number;
  max?: number;
  minMessage?: string;
  maxMessage?: string;
  injectionMessage?: string;
}): z.ZodType<string> {
  const {
    kind,
    min,
    max,
    minMessage,
    maxMessage,
    injectionMessage = kind === "persona"
      ? "Invalid persona. Please describe a valid creative perspective."
      : "Content contains invalid patterns. Please revise your input.",
  } = opts;

  let schema = z.string();

  if (typeof min === "number") {
    schema = schema.min(min, minMessage ? { message: minMessage } : undefined);
  }
  if (typeof max === "number") {
    schema = schema.max(max, maxMessage ? { message: maxMessage } : undefined);
  }

  return schema.superRefine((val, ctx) => {
    if (detectInjectionAttempt(val)) {
      ctx.addIssue({ code: "custom", message: injectionMessage });
    }
  });
}

export function validateAIOutput(output: string): void {
  for (const pattern of OUTPUT_LEAK_PATTERNS) {
    if (pattern.test(output)) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "AI output failed security validation. Please retry.",
      });
    }
  }
}
