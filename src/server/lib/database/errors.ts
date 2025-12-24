import "server-only";
import * as Data from "effect/Data";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  operation: string;
  cause?: unknown;
}> {}

export class NotFoundError extends Data.TaggedError("NotFoundError")<{
  resource: string;
  id: string;
}> {}

export class QuotaExceededError extends Data.TaggedError("QuotaExceededError")<{
  currentUsage: number;
  limit: number;
}> {}
