import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import type { usageStats } from "@/db/schema";
import {
  type getCurrentMonthUsage,
  getStartOfMonth,
  USAGE_LIMITS,
} from "./usage";

const mockQuery = {
  usageStats: {
    findFirst: mock<() => Promise<typeof usageStats.$inferSelect | undefined>>(
      () => Promise.resolve(undefined),
    ),
  },
};

mock.module("@/db", () => ({
  db: {
    query: mockQuery,
  },
}));

let getCurrentMonthUsageFn: typeof getCurrentMonthUsage;

beforeAll(async () => {
  const module = await import("./usage");
  getCurrentMonthUsageFn = module.getCurrentMonthUsage;
});

describe("usage", () => {
  beforeEach(() => {
    mockQuery.usageStats.findFirst.mockClear();
  });

  describe("getStartOfMonth", () => {
    test("returns first day of current month", () => {
      const input = new Date("2024-06-15T12:34:56Z");
      const result = getStartOfMonth(input);
      expect(result.getFullYear()).toBe(input.getFullYear());
      expect(result.getMonth()).toBe(input.getMonth());
      expect(result.getDate()).toBe(1);
    });

    test("handles December correctly", () => {
      const input = new Date("2024-12-31T23:59:59Z");
      const result = getStartOfMonth(input);
      expect(result.getFullYear()).toBe(input.getFullYear());
      expect(result.getMonth()).toBe(input.getMonth());
      expect(result.getDate()).toBe(1);
    });

    test("handles January correctly", () => {
      const input = new Date("2025-01-01T00:00:00Z");
      const result = getStartOfMonth(input);
      expect(result.getFullYear()).toBe(input.getFullYear());
      expect(result.getMonth()).toBe(input.getMonth());
      expect(result.getDate()).toBe(1);
    });
  });

  describe("getCurrentMonthUsage", () => {
    test("returns default values when no stats exist", async () => {
      mockQuery.usageStats.findFirst.mockResolvedValueOnce(undefined);

      const result = await getCurrentMonthUsageFn("user1");

      expect(result).toEqual({
        seedsCreated: 0,
        transformationsCreated: 0,
        transformationsPosted: 0,
        freeSeedsCreated: 0,
        freeTransformationsCreated: 0,
      });
    });

    test("returns existing stats when found", async () => {
      const mockStats = {
        id: crypto.randomUUID(),
        userId: "user1",
        month: getStartOfMonth(),
        seedsCreated: 5,
        transformationsCreated: 10,
        transformationsPosted: 3,
        freeSeedsCreated: 2,
        freeTransformationsCreated: 4,
      };

      mockQuery.usageStats.findFirst.mockResolvedValueOnce(mockStats);

      const result = await getCurrentMonthUsageFn("user1");

      expect(result).toEqual(mockStats);
      expect(mockQuery.usageStats.findFirst).toHaveBeenCalled();
    });
  });

  test("USAGE_LIMITS defines correct limits", () => {
    expect(USAGE_LIMITS.free).toBe(10);
    expect(USAGE_LIMITS.creator).toBe(100);
    expect(USAGE_LIMITS.pro).toBeNull();
  });
});
