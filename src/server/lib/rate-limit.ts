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

// X: 17 posts/day (Free tier - app-level, shared across all users)
export const xPublishLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(17, "24h"),
  analytics: true,
  timeout: 5000,
  prefix: "x_publish_app",
  ephemeralCache,
});

// LinkedIn: 150 posts/day per user
export const linkedInPublishLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(150, "24h"),
  analytics: true,
  timeout: 5000,
  prefix: "linkedin_publish",
  ephemeralCache,
});
