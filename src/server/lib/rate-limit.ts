import { TRPCError } from "@trpc/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const ephemeralCache = new Map();

const guestRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "15m"),
  analytics: true,
  timeout: 5000,
  prefix: "guest",
  ephemeralCache,
});

const authenticatedRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10m"),
  analytics: true,
  timeout: 5000,
  prefix: "auth",
  ephemeralCache,
});

export async function checkGuestRateLimit(ip: string): Promise<boolean> {
  try {
    const { success } = await guestRateLimit.limit(ip);
    return success;
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail-open: allow requests when Redis is unavailable
    return true;
  }
}

export async function checkAuthenticatedRateLimit(
  userId: string,
): Promise<boolean> {
  try {
    const { success } = await authenticatedRateLimit.limit(userId);
    return success;
  } catch (error) {
    console.error("Rate limit error:", error);
    // Fail-open: allow requests when Redis is unavailable
    return true;
  }
}

export function getClientIP(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const vercelForwardedFor = headers.get("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(",")[0].trim();
  }

  throw new TRPCError({
    code: "BAD_REQUEST",
    message: "Unable to process request. Please try again.",
  });
}
