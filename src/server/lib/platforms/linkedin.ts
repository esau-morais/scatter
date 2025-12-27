import "server-only";
import * as Context from "effect/Context";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schedule from "effect/Schedule";
import * as Schema from "effect/Schema";

const LinkedInUserInfoSchema = Schema.Struct({
  sub: Schema.optional(Schema.String),
});

const LinkedInErrorSchema = Schema.Struct({
  error_description: Schema.optional(Schema.String),
});

const LinkedInPostErrorSchema = Schema.Struct({
  message: Schema.optional(Schema.String),
  errorDetails: Schema.optional(Schema.String),
});

export class LinkedInApiError extends Data.TaggedError("LinkedInApiError")<{
  status: number;
  message: string;
}> {}

export class LinkedInAuthError extends Data.TaggedError("LinkedInAuthError")<{
  message: string;
}> {}

export class LinkedInDataError extends Data.TaggedError("LinkedInDataError")<{
  message: string;
}> {}

export interface LinkedInService {
  readonly getPersonUrn: (
    accessToken: string,
  ) => Effect.Effect<
    string,
    LinkedInApiError | LinkedInAuthError | LinkedInDataError
  >;
  readonly post: (params: {
    accessToken: string;
    authorUrn: string;
    text: string;
  }) => Effect.Effect<
    { postId: string },
    LinkedInApiError | LinkedInAuthError | LinkedInDataError
  >;
}

export const LinkedInService =
  Context.GenericTag<LinkedInService>("LinkedInService");

const makeLinkedInService = (): LinkedInService => ({
  getPersonUrn: (accessToken) => {
    return Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: () =>
          fetch("https://api.linkedin.com/v2/userinfo", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        catch: (error) =>
          new LinkedInApiError({
            status: 0,
            message: `Network error: ${String(error)}`,
          }),
      });

      if (!response.ok) {
        const jsonBody = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (error) =>
            new LinkedInApiError({
              status: response.status,
              message: `Failed to parse error response: ${String(error)}`,
            }),
        });

        const errorBody = yield* Schema.decodeUnknown(LinkedInErrorSchema)(
          jsonBody,
        ).pipe(
          Effect.catchAll(() =>
            Effect.succeed(
              {} as Schema.Schema.Type<typeof LinkedInErrorSchema>,
            ),
          ),
        );

        const message =
          errorBody.error_description ||
          `Failed to fetch LinkedIn user info: ${response.status}`;

        if (response.status === 401) {
          return yield* Effect.fail(
            new LinkedInAuthError({
              message:
                "Authentication failed. Please reconnect your LinkedIn account.",
            }),
          );
        }

        return yield* Effect.fail(
          new LinkedInApiError({
            status: response.status,
            message,
          }),
        );
      }

      const jsonBody = yield* Effect.tryPromise({
        try: () => response.json(),
        catch: (error) =>
          new LinkedInApiError({
            status: response.status,
            message: `Failed to parse response: ${String(error)}`,
          }),
      });

      const data = yield* Schema.decodeUnknown(LinkedInUserInfoSchema)(
        jsonBody,
      ).pipe(
        Effect.mapError(
          (parseError) =>
            new LinkedInApiError({
              status: response.status,
              message: `Invalid response format: ${String(parseError)}`,
            }),
        ),
      );

      if (!data.sub) {
        return yield* Effect.fail(
          new LinkedInDataError({
            message: "LinkedIn user info did not contain person URN",
          }),
        );
      }

      return data.sub.startsWith("urn:li:person:")
        ? data.sub
        : `urn:li:person:${data.sub}`;
    }).pipe(
      Effect.retry({
        schedule: Schedule.exponential("500 millis").pipe(
          Schedule.compose(Schedule.recurs(2)),
        ),
        while: (error) =>
          error._tag === "LinkedInApiError" && error.status >= 500,
      }),
    );
  },

  post: (params) => {
    const { accessToken, authorUrn, text } = params;

    return Effect.gen(function* () {
      const response = yield* Effect.tryPromise({
        try: () =>
          fetch("https://api.linkedin.com/v2/ugcPosts", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "X-Restli-Protocol-Version": "2.0.0",
            },
            body: JSON.stringify({
              author: authorUrn,
              lifecycleState: "PUBLISHED",
              specificContent: {
                "com.linkedin.ugc.ShareContent": {
                  shareCommentary: { text },
                  shareMediaCategory: "NONE",
                },
              },
              visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
              },
            }),
          }),
        catch: (error) =>
          new LinkedInApiError({
            status: 0,
            message: `Network error: ${String(error)}`,
          }),
      });

      if (!response.ok) {
        const jsonBody = yield* Effect.tryPromise({
          try: () => response.json(),
          catch: (error) =>
            new LinkedInApiError({
              status: response.status,
              message: `Failed to parse error response: ${String(error)}`,
            }),
        });

        const errorBody = yield* Schema.decodeUnknown(LinkedInPostErrorSchema)(
          jsonBody,
        ).pipe(
          Effect.catchAll(() =>
            Effect.succeed(
              {} as Schema.Schema.Type<typeof LinkedInPostErrorSchema>,
            ),
          ),
        );

        const message =
          errorBody.message ||
          errorBody.errorDetails ||
          `LinkedIn API error: ${response.status}`;

        if (response.status === 429) {
          return yield* Effect.fail(
            new LinkedInApiError({
              status: 429,
              message: "Rate limit exceeded. Please try again later.",
            }),
          );
        }

        if (response.status === 401) {
          return yield* Effect.fail(
            new LinkedInAuthError({
              message:
                "Authentication failed. Please reconnect your LinkedIn account.",
            }),
          );
        }

        return yield* Effect.fail(
          new LinkedInApiError({
            status: response.status,
            message,
          }),
        );
      }

      const postId = response.headers.get("X-RestLi-Id");
      if (!postId) {
        return yield* Effect.fail(
          new LinkedInDataError({
            message: "LinkedIn API did not return a post ID",
          }),
        );
      }

      return { postId };
    }).pipe(
      Effect.retry({
        schedule: Schedule.exponential("500 millis").pipe(
          Schedule.compose(Schedule.recurs(2)),
        ),
        while: (error) =>
          error._tag === "LinkedInApiError" &&
          (error.status >= 500 || error.status === 429),
      }),
    );
  },
});

export const LinkedInServiceLive = Layer.succeed(
  LinkedInService,
  makeLinkedInService(),
);
