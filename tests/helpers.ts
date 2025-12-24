import type { Context } from "@/server/trpc";

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
