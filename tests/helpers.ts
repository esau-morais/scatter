import type { Session } from "@/lib/auth";
import type { users } from "@/lib/auth/auth-schema";
import type { Context } from "@/server/trpc";

export function createMockUser(
  overrides?: Partial<typeof users.$inferSelect>,
): typeof users.$inferSelect {
  return {
    id: crypto.randomUUID(),
    name: "Test User",
    email: "test@example.com",
    emailVerified: true,
    image: null,
    plan: "free",
    polarCustomerId: null,
    polarSubscriptionId: null,
    onboardingCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockSession(
  userOverrides?: Partial<typeof users.$inferSelect>,
): Session {
  const user = createMockUser(userOverrides);
  return {
    session: {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      token: crypto.randomUUID(),
      ipAddress: "192.168.1.1",
      userAgent: "test-agent",
    },
    user,
  };
}

export function createMockContext(overrides?: Partial<Context>): Context {
  const mockHeaders = new Headers({
    "x-forwarded-for": "192.168.1.1",
    "user-agent": "test-agent",
    "accept-language": "en-US",
  });

  return {
    session: null,
    db: {} as Context["db"],
    headers: mockHeaders,
    fingerprint: "test-fingerprint",
    ...overrides,
  };
}
