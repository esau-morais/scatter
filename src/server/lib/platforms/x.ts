import "server-only";
import * as Context from "effect/Context";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schedule from "effect/Schedule";
import * as Schema from "effect/Schema";

const XPostResponseSchema = Schema.Struct({
  data: Schema.Struct({
    id: Schema.String,
    text: Schema.String,
  }),
});

export type XPostResponse = Schema.Schema.Type<typeof XPostResponseSchema>;

const XErrorResponseSchema = Schema.Struct({
  errors: Schema.optional(
    Schema.Array(
      Schema.Struct({
        message: Schema.String,
        code: Schema.Number,
      }),
    ),
  ),
  title: Schema.optional(Schema.String),
  detail: Schema.optional(Schema.String),
});

type XErrorResponse = Schema.Schema.Type<typeof XErrorResponseSchema>;

export class XApiError extends Data.TaggedError("XApiError")<{
  status: number;
  message: string;
  retryAfter?: Date;
}> {}

export class XAuthError extends Data.TaggedError("XAuthError")<{
  message: string;
}> {}

export class XForbiddenError extends Data.TaggedError("XForbiddenError")<{
  message: string;
}> {}

export interface XService {
  readonly post: (params: {
    accessToken: string;
    text: string;
    replyToTweetId?: string;
  }) => Effect.Effect<XPostResponse, XApiError | XAuthError | XForbiddenError>;
}

export const XService = Context.GenericTag<XService>("XService");

const makeXService = (): XService => ({
  post: (params) => {
    const { accessToken, text, replyToTweetId } = params;

    return Effect.gen(function* () {
      const body: Record<string, unknown> = { text };
      if (replyToTweetId) {
        body.reply = { in_reply_to_tweet_id: replyToTweetId };
      }

      const response = yield* Effect.tryPromise({
        try: () =>
          fetch("https://api.x.com/2/tweets", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          }),
        catch: (error) =>
          new XApiError({
            status: 0,
            message: `Network error: ${String(error)}`,
          }),
      });

      if (!response.ok) {
        const jsonBody = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (error) =>
            new XApiError({
              status: response.status,
              message: `Failed to parse error response: ${String(error)}`,
            }),
        });

        const errorBody = yield* Schema.decodeUnknown(XErrorResponseSchema)(
          jsonBody,
        ).pipe(Effect.catchAll(() => Effect.succeed({} as XErrorResponse)));

        const message =
          errorBody.errors?.[0]?.message ||
          errorBody.title ||
          errorBody.detail ||
          `X API error: ${response.status}`;

        if (response.status === 429) {
          const retryAfter = response.headers.get("x-rate-limit-reset");
          return yield* Effect.fail(
            new XApiError({
              status: 429,
              message: `Rate limit exceeded. ${retryAfter ? `Retry after ${new Date(Number(retryAfter) * 1000).toLocaleString()}` : "Please try again later."}`,
              retryAfter: retryAfter
                ? new Date(Number(retryAfter) * 1000)
                : undefined,
            }),
          );
        }

        if (response.status === 401) {
          return yield* Effect.fail(
            new XAuthError({
              message:
                "Authentication failed. Please reconnect your X account.",
            }),
          );
        }

        if (response.status === 403) {
          return yield* Effect.fail(
            new XForbiddenError({
              message:
                "Forbidden: Your X account may not have the required permissions. Please disconnect and reconnect your X account in Settings to grant posting permissions.",
            }),
          );
        }

        return yield* Effect.fail(
          new XApiError({
            status: response.status,
            message,
          }),
        );
      }

      const jsonBody = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: (error) =>
          new XApiError({
            status: response.status,
            message: `Failed to parse response: ${String(error)}`,
          }),
      });

      const data = yield* Schema.decodeUnknown(XPostResponseSchema)(
        jsonBody,
      ).pipe(
        Effect.mapError(
          (parseError) =>
            new XApiError({
              status: response.status,
              message: `Invalid response format: ${String(parseError)}`,
            }),
        ),
      );

      return data;
    }).pipe(
      Effect.retry({
        schedule: Schedule.exponential("500 millis").pipe(
          Schedule.compose(Schedule.recurs(2)),
        ),
        while: (error) =>
          error._tag === "XApiError" &&
          (error.status >= 500 || error.status === 429),
      }),
    );
  },
});

export const XServiceLive = Layer.succeed(XService, makeXService());
