import { describe, expect, test } from "bun:test";
import { checkAuthenticatedRateLimit, checkGuestRateLimit } from "./rate-limit";

describe("rate-limit", () => {
  test("checkGuestRateLimit fails open when Redis unavailable", async () => {
    const result = await checkGuestRateLimit("192.168.1.1");
    expect(result).toBe(true);
  });

  test("checkAuthenticatedRateLimit fails open when Redis unavailable", async () => {
    const result = await checkAuthenticatedRateLimit("user123");
    expect(result).toBe(true);
  });
});
