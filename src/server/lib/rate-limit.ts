import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const ephemeralCache = new Map();

const guestRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "24h"),
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
