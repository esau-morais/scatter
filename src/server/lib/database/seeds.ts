import "server-only";
import { and, desc, eq } from "drizzle-orm";
import * as Effect from "effect/Effect";
import { db } from "@/db";
import { seeds, type transformations } from "@/db/schema";
import { DatabaseError, NotFoundError } from "./errors";

export function findSeedEffect(
  id: string,
  userId: string,
): Effect.Effect<typeof seeds.$inferSelect, DatabaseError | NotFoundError> {
  return Effect.gen(function* () {
    const seed = yield* Effect.tryPromise({
      try: () =>
        db.query.seeds.findFirst({
          where: eq(seeds.id, id),
        }),
      catch: (error) =>
        new DatabaseError({ operation: "findSeed", cause: error }),
    });

    if (!seed || seed.userId !== userId) {
      return yield* Effect.fail(new NotFoundError({ resource: "seed", id }));
    }

    return seed;
  });
}

export function findSeedWithTransformationsEffect(
  id: string,
  userId: string,
): Effect.Effect<
  typeof seeds.$inferSelect & {
    transformations: Array<typeof transformations.$inferSelect>;
  },
  DatabaseError | NotFoundError
> {
  return Effect.gen(function* () {
    const seed = yield* Effect.tryPromise({
      try: () =>
        db.query.seeds.findFirst({
          where: and(eq(seeds.id, id), eq(seeds.userId, userId)),
          with: {
            transformations: true,
          },
        }),
      catch: (error) =>
        new DatabaseError({
          operation: "findSeedWithTransformations",
          cause: error,
        }),
    });

    if (!seed) {
      return yield* Effect.fail(new NotFoundError({ resource: "seed", id }));
    }

    return seed;
  });
}

export function listSeedsEffect(userId: string): Effect.Effect<
  Array<
    typeof seeds.$inferSelect & {
      transformations: Array<typeof transformations.$inferSelect>;
    }
  >,
  DatabaseError
> {
  return Effect.tryPromise({
    try: () =>
      db.query.seeds.findMany({
        where: eq(seeds.userId, userId),
        orderBy: desc(seeds.createdAt),
        with: {
          transformations: true,
        },
      }),
    catch: (error) =>
      new DatabaseError({ operation: "listSeeds", cause: error }),
  });
}

export function createSeedEffect(params: {
  userId: string;
  title?: string;
  content: string;
}): Effect.Effect<typeof seeds.$inferSelect, DatabaseError> {
  return Effect.gen(function* () {
    const [seed] = yield* Effect.tryPromise({
      try: () =>
        db
          .insert(seeds)
          .values({
            userId: params.userId,
            title: params.title,
            content: params.content,
          })
          .returning(),
      catch: (error) =>
        new DatabaseError({ operation: "createSeed", cause: error }),
    });

    return seed;
  });
}

export function deleteSeedEffect(
  id: string,
  userId: string,
): Effect.Effect<{ success: boolean }, DatabaseError | NotFoundError> {
  return Effect.gen(function* () {
    const [deleted] = yield* Effect.tryPromise({
      try: () =>
        db
          .delete(seeds)
          .where(and(eq(seeds.id, id), eq(seeds.userId, userId)))
          .returning(),
      catch: (error) =>
        new DatabaseError({ operation: "deleteSeed", cause: error }),
    });

    if (!deleted) {
      return yield* Effect.fail(new NotFoundError({ resource: "seed", id }));
    }

    return { success: true };
  });
}
