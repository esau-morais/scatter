import "server-only";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Schedule from "effect/Schedule";
import { db } from "@/db";
import { accounts } from "@/lib/auth/auth-schema";
import { DatabaseError } from "./database/errors";

class TokenVerificationFailed extends Data.TaggedError(
  "TokenVerificationFailed",
)<{
  provider: string;
  status: number;
  cause?: unknown;
}> {}

class TransientError extends Data.TaggedError("TransientError")<{
  status: number;
  cause?: unknown;
}> {}

export async function validateToken(params: {
  userId: string;
  provider: "twitter" | "linkedin";
}): Promise<boolean> {
  const { userId, provider } = params;

  const account = await db.query.accounts.findFirst({
    where: (accounts, { and, eq }) =>
      and(eq(accounts.userId, userId), eq(accounts.providerId, provider)),
  });

  if (!account?.accessToken) return false;

  const verifyEffect = Effect.gen(function* () {
    const result = yield* Effect.tryPromise({
      try: () =>
        provider === "twitter"
          ? verifyTwitterToken(account.accessToken!)
          : verifyLinkedInToken(account.accessToken!),
      catch: (error) => new TransientError({ status: 0, cause: error }),
    });

    if (result.status === 401) {
      yield* Effect.tryPromise({
        try: () => db.delete(accounts).where(eq(accounts.id, account.id)),
        catch: (error) =>
          new DatabaseError({ operation: "deleteAccount", cause: error }),
      });
      return yield* Effect.fail(
        new TokenVerificationFailed({ provider, status: 401 }),
      );
    }

    if (!result.ok) {
      return yield* Effect.fail(new TransientError({ status: result.status }));
    }

    return true;
  }).pipe(
    Effect.catchTag("TransientError", (error) => {
      if (error.status >= 500 || error.status === 429) {
        return Effect.logWarning("Transient error, failing open", error).pipe(
          Effect.as(false),
        );
      }
      return Effect.succeed(false);
    }),
    Effect.catchTag("TokenVerificationFailed", () => Effect.succeed(false)),
  );

  return Effect.runPromise(verifyEffect);
}

type TokenVerificationResult = { ok: boolean; status: number };

async function verifyTwitterToken(
  accessToken: string,
): Promise<TokenVerificationResult> {
  const res = await fetch("https://api.x.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return { ok: res.ok, status: res.status };
}

async function verifyLinkedInToken(
  accessToken: string,
): Promise<TokenVerificationResult> {
  const res = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return { ok: res.ok, status: res.status };
}

class TokenRefreshFailed extends Data.TaggedError("TokenRefreshFailed")<{
  provider: string;
  cause: unknown;
}> {}

class AccountNotFound extends Data.TaggedError("AccountNotFound")<{
  provider: string;
}> {}

class RefreshTokenMissing extends Data.TaggedError("RefreshTokenMissing")<{
  provider: string;
}> {}

export async function getValidToken(params: {
  userId: string;
  provider: "twitter" | "linkedin";
}): Promise<string> {
  const { userId, provider } = params;

  const getTokenEffect = Effect.gen(function* () {
    const account = yield* Effect.tryPromise({
      try: () =>
        db.query.accounts.findFirst({
          where: (accounts, { and, eq }) =>
            and(eq(accounts.userId, userId), eq(accounts.providerId, provider)),
        }),
      catch: (error) =>
        new DatabaseError({ operation: "findAccount", cause: error }),
    });

    if (!account) {
      return yield* Effect.fail(new AccountNotFound({ provider }));
    }

    if (
      account.accessToken &&
      account.accessTokenExpiresAt &&
      account.accessTokenExpiresAt > new Date()
    ) {
      return account.accessToken;
    }

    if (!account.refreshToken) {
      return yield* Effect.fail(new RefreshTokenMissing({ provider }));
    }

    const newTokens = yield* Effect.tryPromise({
      try: () => refreshOAuthToken(provider, account.refreshToken!),
      catch: (error) => new TokenRefreshFailed({ provider, cause: error }),
    }).pipe(
      Effect.retry(
        Schedule.exponential("100 millis").pipe(
          Schedule.compose(Schedule.recurs(2)),
        ),
      ),
      Effect.tapError((error) =>
        Effect.logError("Token refresh failed after retries", error),
      ),
    );

    yield* Effect.tryPromise({
      try: () =>
        db
          .update(accounts)
          .set({
            accessToken: newTokens.accessToken,
            accessTokenExpiresAt: newTokens.expiresAt,
            refreshToken: newTokens.refreshToken ?? account.refreshToken,
          })
          .where(eq(accounts.id, account.id)),
      catch: (error) =>
        new DatabaseError({ operation: "updateAccount", cause: error }),
    });

    return newTokens.accessToken;
  }).pipe(
    Effect.catchTag("AccountNotFound", (error) =>
      Effect.fail(
        new TRPCError({
          code: "NOT_FOUND",
          message: `${error.provider === "twitter" ? "X" : "LinkedIn"} account not connected. Please connect your account first.`,
        }),
      ),
    ),
    Effect.catchTag("DatabaseError", (error) =>
      Effect.fail(
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database error ocurred",
          cause: error,
        }),
      ),
    ),
    Effect.catchTag("RefreshTokenMissing", (error) =>
      Effect.fail(
        new TRPCError({
          code: "UNAUTHORIZED",
          message: `Your ${error.provider === "twitter" ? "X" : "LinkedIn"} session has expired. Please reconnect your account.`,
        }),
      ),
    ),
    Effect.catchTag("TokenRefreshFailed", (error) =>
      Effect.fail(
        new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to refresh ${error.provider === "twitter" ? "X" : "LinkedIn"} token. Please try again.`,
          cause: error.cause,
        }),
      ),
    ),
  );

  return Effect.runPromise(getTokenEffect);
}

async function refreshOAuthToken(
  provider: "twitter" | "linkedin",
  refreshToken: string,
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}> {
  if (provider === "twitter") {
    return refreshTwitterToken(refreshToken);
  } else {
    return refreshLinkedInToken(refreshToken);
  }
}

async function refreshTwitterToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}> {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Twitter OAuth credentials not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
    "base64",
  );

  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error_description ||
        `Failed to refresh Twitter token: ${response.status}`,
    );
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 7200; // Default 2 hours

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}

async function refreshLinkedInToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}> {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("LinkedIn OAuth credentials not configured");
  }

  const response = await fetch(
    "https://www.linkedin.com/oauth/v2/accessToken",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error_description ||
        `Failed to refresh LinkedIn token: ${response.status}`,
    );
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 5184000; // Default 60 days

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + expiresIn * 1000),
  };
}
