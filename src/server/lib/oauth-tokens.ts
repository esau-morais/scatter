import "server-only";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { accounts } from "@/lib/auth/auth-schema";

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

  try {
    const result =
      provider === "twitter"
        ? await verifyTwitterToken(account.accessToken)
        : await verifyLinkedInToken(account.accessToken);

    // Only delete the connected account when the provider confirms the token is invalid.
    // Non-2xx responses can include transient outages (5xx) or rate limits (429),
    // which should NOT cause users to lose their connected accounts.
    if (result.status === 401) {
      await db.delete(accounts).where(eq(accounts.id, account.id));
      return false;
    }

    return result.ok;
  } catch {
    return false;
  }
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

export async function getValidToken(params: {
  userId: string;
  provider: "twitter" | "linkedin";
}): Promise<string> {
  const { userId, provider } = params;

  const account = await db.query.accounts.findFirst({
    where: (accounts, { and, eq }) =>
      and(eq(accounts.userId, userId), eq(accounts.providerId, provider)),
  });

  if (!account) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `${provider === "twitter" ? "X" : "LinkedIn"} account not connected. Please connect your account first.`,
    });
  }

  if (
    account.accessToken &&
    account.accessTokenExpiresAt &&
    account.accessTokenExpiresAt > new Date()
  ) {
    return account.accessToken;
  }

  if (!account.refreshToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: `Your ${provider === "twitter" ? "X" : "LinkedIn"} session has expired. Please reconnect your account.`,
    });
  }

  const newTokens = await refreshOAuthToken(provider, account.refreshToken);

  await db
    .update(accounts)
    .set({
      accessToken: newTokens.accessToken,
      accessTokenExpiresAt: newTokens.expiresAt,
      refreshToken: newTokens.refreshToken ?? account.refreshToken,
    })
    .where(eq(accounts.id, account.id));

  return newTokens.accessToken;
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
