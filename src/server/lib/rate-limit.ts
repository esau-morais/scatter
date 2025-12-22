import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";

const redis = Redis.fromEnv();

const ephemeralCache = new Map();

class RateLimitExceeded extends Data.TaggedError("RateLimitExceeded")<{
  identifier: string;
  resetAt?: Date;
}> {}

class RateLimitUnavailable extends Data.TaggedError("RateLimitUnavailable")<{
  cause: unknown;
}> {}

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
  const rateLimitEffect = Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      try: () => guestRateLimit.limit(ip),
      catch: (error) => new RateLimitUnavailable({ cause: error }),
    });

    if (!result.success) {
      return yield* Effect.fail(
        new RateLimitExceeded({
          identifier: ip,
          resetAt: result.reset ? new Date(result.reset) : undefined,
        }),
      );
    }

    return true;
  }).pipe(
    Effect.catchTag("RateLimitUnavailable", (error) =>
      Effect.logWarning("Redis unavailable, failing open (guest)", error).pipe(
        Effect.as(true),
      ),
    ),
    Effect.catchTag("RateLimitExceeded", () => Effect.succeed(false)),
  );

  return Effect.runPromise(rateLimitEffect);
}

export async function checkAuthenticatedRateLimit(
  userId: string,
): Promise<boolean> {
  const rateLimitEffect = Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      try: () => authenticatedRateLimit.limit(userId),
      catch: (error) => new RateLimitUnavailable({ cause: error }),
    });

    if (!result.success) {
      return yield* Effect.fail(
        new RateLimitExceeded({
          identifier: userId,
          resetAt: result.reset ? new Date(result.reset) : undefined,
        }),
      );
    }

    return true;
  }).pipe(
    Effect.catchTag("RateLimitUnavailable", (error) =>
      Effect.logWarning("Redis unavailable, failing open (auth)", error).pipe(
        Effect.as(true),
      ),
    ),
    Effect.catchTag("RateLimitExceeded", () => Effect.succeed(false)),
  );

  return Effect.runPromise(rateLimitEffect);
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
