import { describe, expect, test } from "bun:test";
import { getStartOfMonth, USAGE_LIMITS } from "./usage";

describe("usage", () => {
  test("getStartOfMonth returns first day of current month", () => {
    const result = getStartOfMonth(new Date("2024-06-15T12:34:56Z"));
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(1);
  });

  test("getStartOfMonth handles December correctly", () => {
    const result = getStartOfMonth(new Date("2024-12-31T23:59:59Z"));
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(11);
    expect(result.getDate()).toBe(1);
  });

  test("getStartOfMonth handles January correctly", () => {
    const result = getStartOfMonth(new Date("2025-01-01T00:00:00Z"));
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0);
    expect(result.getDate()).toBe(1);
  });

  test("USAGE_LIMITS defines correct limits", () => {
    expect(USAGE_LIMITS.free).toBe(10);
    expect(USAGE_LIMITS.creator).toBe(100);
    expect(USAGE_LIMITS.pro).toBeNull();
  });
});
