import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { Account } from "@/lib/auth/auth-schema";

function createMockAccount(overrides?: Partial<Account>): Account {
  return {
    id: "acc1",
    accountId: "account-123",
    userId: "user1",
    providerId: "twitter",
    accessToken: null,
    refreshToken: null,
    idToken: null,
    accessTokenExpiresAt: null,
    refreshTokenExpiresAt: null,
    scope: null,
    password: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

const mockFetch = mock(() =>
  Promise.resolve(
    new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  ),
);
global.fetch = mockFetch as unknown as typeof fetch;

const mockDelete = mock(() => Promise.resolve());
const mockQuery = {
  accounts: {
    findFirst: mock<() => Promise<Account | undefined>>(() =>
      Promise.resolve(undefined),
    ),
  },
};
const mockUpdate = mock(() => ({
  set: mock(() => ({
    where: mock(() => Promise.resolve()),
  })),
}));

mock.module("@/db", () => ({
  db: {
    query: mockQuery,
    delete: mock(() => ({
      where: mockDelete,
    })),
    update: mockUpdate,
  },
}));

let validateToken: typeof import("./oauth-tokens").validateToken;
let getValidToken: typeof import("./oauth-tokens").getValidToken;

beforeAll(async () => {
  const module = await import("./oauth-tokens");
  validateToken = module.validateToken;
  getValidToken = module.getValidToken;
});

describe("oauth-tokens", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockQuery.accounts.findFirst.mockClear();
    mockDelete.mockClear();
  });

  describe("validateToken", () => {
    test("returns false when account not found", async () => {
      mockQuery.accounts.findFirst.mockResolvedValueOnce(undefined);
      const result = await validateToken({
        userId: "user1",
        provider: "twitter",
      });
      expect(result).toBe(false);
    });

    test("returns false when accessToken missing", async () => {
      mockQuery.accounts.findFirst.mockResolvedValueOnce(createMockAccount());
      const result = await validateToken({
        userId: "user1",
        provider: "twitter",
      });
      expect(result).toBe(false);
    });

    test("verifies Twitter token and returns true on success", async () => {
      mockQuery.accounts.findFirst.mockResolvedValueOnce(
        createMockAccount({ accessToken: "valid-token" }),
      );

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { id: "123" } }), {
          status: 200,
        }),
      );

      const result = await validateToken({
        userId: "user1",
        provider: "twitter",
      });
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith("https://api.x.com/2/users/me", {
        headers: { Authorization: "Bearer valid-token" },
      });
    });

    test("verifies LinkedIn token and returns true on success", async () => {
      mockQuery.accounts.findFirst.mockResolvedValueOnce(
        createMockAccount({
          providerId: "linkedin",
          accessToken: "valid-token",
        }),
      );

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ sub: "123" }), {
          status: 200,
        }),
      );

      const result = await validateToken({
        userId: "user1",
        provider: "linkedin",
      });
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.linkedin.com/v2/userinfo",
        {
          headers: { Authorization: "Bearer valid-token" },
        },
      );
    });

    test("deletes account and returns false on 401", async () => {
      mockQuery.accounts.findFirst.mockResolvedValueOnce(
        createMockAccount({ accessToken: "expired-token" }),
      );

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }),
      );

      const result = await validateToken({
        userId: "user1",
        provider: "twitter",
      });
      expect(result).toBe(false);
      expect(mockDelete).toHaveBeenCalled();
    });

    test("fails open on 500 error", async () => {
      mockQuery.accounts.findFirst.mockResolvedValueOnce(
        createMockAccount({ accessToken: "token" }),
      );

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Internal Error" }), {
          status: 500,
        }),
      );

      const result = await validateToken({
        userId: "user1",
        provider: "twitter",
      });
      expect(result).toBe(false);
    });

    test("fails open on 429 rate limit", async () => {
      mockQuery.accounts.findFirst.mockResolvedValueOnce(
        createMockAccount({ accessToken: "token" }),
      );

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Too Many Requests" }), {
          status: 429,
        }),
      );

      const result = await validateToken({
        userId: "user1",
        provider: "twitter",
      });
      expect(result).toBe(false);
    });
  });

  describe("getValidToken", () => {
    test("throws NOT_FOUND when account not found", () => {
      mockQuery.accounts.findFirst.mockResolvedValueOnce(undefined);
      expect(
        getValidToken({ userId: "user1", provider: "twitter" }),
      ).rejects.toThrow(
        "X account not connected. Please connect your account first.",
      );
    });

    test("returns existing token when not expired", async () => {
      const futureDate = new Date(Date.now() + 3600000);
      mockQuery.accounts.findFirst.mockResolvedValueOnce(
        createMockAccount({
          accessToken: "valid-token",
          accessTokenExpiresAt: futureDate,
          refreshToken: "refresh-token",
        }),
      );

      const token = await getValidToken({
        userId: "user1",
        provider: "twitter",
      });
      expect(token).toBe("valid-token");
    });

    test("throws UNAUTHORIZED when refresh token missing", async () => {
      const pastDate = new Date(Date.now() - 3600000);
      mockQuery.accounts.findFirst.mockResolvedValueOnce(
        createMockAccount({
          accessToken: "expired-token",
          accessTokenExpiresAt: pastDate,
        }),
      );

      expect(
        getValidToken({ userId: "user1", provider: "twitter" }),
      ).rejects.toThrow(
        "Your X session has expired. Please reconnect your account.",
      );
    });

    test("refreshes Twitter token when expired", async () => {
      const pastDate = new Date(Date.now() - 3600000);
      mockQuery.accounts.findFirst.mockResolvedValueOnce(
        createMockAccount({
          accessToken: "expired-token",
          accessTokenExpiresAt: pastDate,
          refreshToken: "refresh-token",
        }),
      );

      process.env.TWITTER_CLIENT_ID = "client-id";
      process.env.TWITTER_CLIENT_SECRET = "client-secret";

      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "new-token",
            refresh_token: "new-refresh",
            expires_in: 7200,
          }),
          { status: 200 },
        ),
      );

      const token = await getValidToken({
        userId: "user1",
        provider: "twitter",
      });
      expect(token).toBe("new-token");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.x.com/2/oauth2/token",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    test("refreshes LinkedIn token when expired", async () => {
      const pastDate = new Date(Date.now() - 3600000);
      mockQuery.accounts.findFirst.mockResolvedValueOnce(
        createMockAccount({
          providerId: "linkedin",
          accessToken: "expired-token",
          accessTokenExpiresAt: pastDate,
          refreshToken: "refresh-token",
        }),
      );

      process.env.LINKEDIN_CLIENT_ID = "client-id";
      process.env.LINKEDIN_CLIENT_SECRET = "client-secret";

      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "new-token",
            refresh_token: "new-refresh",
            expires_in: 5184000,
          }),
          { status: 200 },
        ),
      );

      const token = await getValidToken({
        userId: "user1",
        provider: "linkedin",
      });
      expect(token).toBe("new-token");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://www.linkedin.com/oauth/v2/accessToken",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });
});
