import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { TRPCError } from "@trpc/server";
import * as Effect from "effect/Effect";
import type { seeds } from "@/db/schema";
import { createMockContext } from "../../../tests/helpers";
import { DatabaseError, NotFoundError } from "../lib/database/errors";

const mockCreateSeedEffect = mock(() => Effect.succeed({} as typeof seeds.$inferSelect));
const mockListSeedsEffect = mock(() => Effect.succeed([]));
const mockFindSeedEffect = mock(() => Effect.succeed({} as typeof seeds.$inferSelect));
const mockFindSeedWithTransformationsEffect = mock(() =>
  Effect.succeed({ transformations: [] } as typeof seeds.$inferSelect & {
    transformations: unknown[];
  }),
);
const mockDeleteSeedEffect = mock(() => Effect.succeed({ success: true }));

mock.module("../lib/database", () => ({
  createSeedEffect: mockCreateSeedEffect,
  listSeedsEffect: mockListSeedsEffect,
  findSeedEffect: mockFindSeedEffect,
  findSeedWithTransformationsEffect: mockFindSeedWithTransformationsEffect,
  deleteSeedEffect: mockDeleteSeedEffect,
}));

let seedsRouter: typeof import("./seeds").seedsRouter;

beforeAll(async () => {
  const module = await import("./seeds");
  seedsRouter = module.seedsRouter;
});

describe("seedsRouter", () => {
  beforeEach(() => {
    mockCreateSeedEffect.mockClear();
    mockListSeedsEffect.mockClear();
    mockFindSeedEffect.mockClear();
    mockFindSeedWithTransformationsEffect.mockClear();
    mockDeleteSeedEffect.mockClear();
  });

  describe("create", () => {
    test("creates seed with content", async () => {
      const mockSeed = {
        id: crypto.randomUUID(),
        userId: "user1",
        content: "Test content",
        title: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateSeedEffect.mockReturnValueOnce(Effect.succeed(mockSeed));

      const ctx = createMockContext({
        session: { user: { id: "user1" } },
      });
      const api = seedsRouter.createCaller(ctx);

      const result = await api.create({
        content: "Test content",
      });

      expect(result).toEqual(mockSeed);
      expect(mockCreateSeedEffect).toHaveBeenCalledWith({
        userId: "user1",
        content: "Test content",
        title: undefined,
      });
    });

    test("creates seed with title and content", async () => {
      const mockSeed = {
        id: crypto.randomUUID(),
        userId: "user1",
        content: "Test content",
        title: "Test title",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCreateSeedEffect.mockReturnValueOnce(Effect.succeed(mockSeed));

      const ctx = createMockContext({
        session: { user: { id: "user1" } },
      });
      const api = seedsRouter.createCaller(ctx);

      const result = await api.create({
        content: "Test content",
        title: "Test title",
      });

      expect(result).toEqual(mockSeed);
      expect(mockCreateSeedEffect).toHaveBeenCalledWith({
        userId: "user1",
        content: "Test content",
        title: "Test title",
      });
    });
  });

  describe("list", () => {
    test("returns list of seeds with transformations", async () => {
      const seedId = crypto.randomUUID();
      const mockSeeds = [
        {
          id: seedId,
          userId: "user1",
          content: "Content 1",
          title: "Title 1",
          createdAt: new Date(),
          updatedAt: new Date(),
          transformations: [
            {
              id: crypto.randomUUID(),
              seedId,
              platform: "x" as const,
              content: "X content",
              postedAt: null,
              xTweetIds: [],
              xPublishingAt: null,
              xLastPublishError: null,
              editedAt: null,
              createdAt: new Date(),
            },
          ],
        },
      ];

      mockListSeedsEffect.mockReturnValueOnce(Effect.succeed(mockSeeds));

      const ctx = createMockContext({
        session: { user: { id: "user1" } },
      });
      const api = seedsRouter.createCaller(ctx);

      const result = await api.list();

      expect(result).toEqual([
        {
          seed: {
            id: seedId,
            userId: "user1",
            content: "Content 1",
            title: "Title 1",
            createdAt: mockSeeds[0].createdAt,
            updatedAt: mockSeeds[0].updatedAt,
          },
          transformations: mockSeeds[0].transformations,
        },
      ]);
      expect(mockListSeedsEffect).toHaveBeenCalledWith("user1");
    });

    test("returns empty list when no seeds", async () => {
      mockListSeedsEffect.mockReturnValueOnce(Effect.succeed([]));

      const ctx = createMockContext({
        session: { user: { id: "user1" } },
      });
      const api = seedsRouter.createCaller(ctx);

      const result = await api.list();

      expect(result).toEqual([]);
    });
  });

  describe("getById", () => {
    test("returns seed by id", async () => {
      const seedId = crypto.randomUUID();
      const mockSeed = {
        id: seedId,
        userId: "user1",
        content: "Test content",
        title: "Test title",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindSeedEffect.mockReturnValueOnce(Effect.succeed(mockSeed));

      const ctx = createMockContext({
        session: { user: { id: "user1" } },
      });
      const api = seedsRouter.createCaller(ctx);

      const result = await api.getById({ id: seedId });

      expect(result).toEqual(mockSeed);
      expect(mockFindSeedEffect).toHaveBeenCalledWith(seedId, "user1");
    });

    test("throws NOT_FOUND when seed not found", async () => {
      const seedId = crypto.randomUUID();
      mockFindSeedEffect.mockReturnValue(
        Effect.fail(new NotFoundError({ resource: "seed", id: seedId })),
      );

      const ctx = createMockContext({
        session: { user: { id: "user1" } },
      });
      const api = seedsRouter.createCaller(ctx);

      await expect(api.getById({ id: seedId })).rejects.toThrow("Seed not found");
    });
  });

  describe("getWithTransformations", () => {
    test("returns seed with transformations", async () => {
      const seedId = crypto.randomUUID();
      const mockSeed = {
        id: seedId,
        userId: "user1",
        content: "Test content",
        title: "Test title",
        createdAt: new Date(),
        updatedAt: new Date(),
        transformations: [
          {
            id: crypto.randomUUID(),
            seedId,
            platform: "x" as const,
            content: "X content",
            postedAt: null,
            xTweetIds: [],
            xPublishingAt: null,
            xLastPublishError: null,
            editedAt: null,
            createdAt: new Date(),
          },
        ],
      };

      mockFindSeedWithTransformationsEffect.mockReturnValueOnce(
        Effect.succeed(mockSeed),
      );

      const ctx = createMockContext({
        session: { user: { id: "user1" } },
      });
      const api = seedsRouter.createCaller(ctx);

      const result = await api.getWithTransformations({ id: seedId });

      expect(result).toEqual({
        seed: mockSeed,
        transformations: mockSeed.transformations,
      });
      expect(mockFindSeedWithTransformationsEffect).toHaveBeenCalledWith(
        seedId,
        "user1",
      );
    });

    test("throws NOT_FOUND when seed not found", async () => {
      const seedId = crypto.randomUUID();
      mockFindSeedWithTransformationsEffect.mockReturnValue(
        Effect.fail(new NotFoundError({ resource: "seed", id: seedId })),
      );

      const ctx = createMockContext({
        session: { user: { id: "user1" } },
      });
      const api = seedsRouter.createCaller(ctx);

      await expect(
        api.getWithTransformations({ id: seedId }),
      ).rejects.toThrow("Seed not found");
    });
  });

  describe("delete", () => {
    test("deletes seed successfully", async () => {
      const seedId = crypto.randomUUID();
      mockDeleteSeedEffect.mockReturnValueOnce(Effect.succeed({ success: true }));

      const ctx = createMockContext({
        session: { user: { id: "user1" } },
      });
      const api = seedsRouter.createCaller(ctx);

      const result = await api.delete({ id: seedId });

      expect(result).toEqual({ success: true });
      expect(mockDeleteSeedEffect).toHaveBeenCalledWith(seedId, "user1");
    });

    test("throws NOT_FOUND when seed not found", async () => {
      const seedId = crypto.randomUUID();
      mockDeleteSeedEffect.mockReturnValue(
        Effect.fail(new NotFoundError({ resource: "seed", id: seedId })),
      );

      const ctx = createMockContext({
        session: { user: { id: "user1" } },
      });
      const api = seedsRouter.createCaller(ctx);

      await expect(api.delete({ id: seedId })).rejects.toThrow("Seed not found");
    });
  });
});

