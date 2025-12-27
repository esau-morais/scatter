import "server-only";
import * as Effect from "effect/Effect";
import {
  LinkedInService,
  PlatformServicesLive,
  type XPostResponse,
  XService,
} from "./platforms";

export type { XPostResponse };

export async function postToX(params: {
  accessToken: string;
  text: string;
  replyToTweetId?: string;
}): Promise<XPostResponse> {
  return Effect.runPromise(
    Effect.flatMap(XService, (service) => service.post(params)).pipe(
      Effect.provide(PlatformServicesLive),
    ),
  );
}

export async function getLinkedInPersonUrn(
  accessToken: string,
): Promise<string> {
  return Effect.runPromise(
    Effect.flatMap(LinkedInService, (service) =>
      service.getPersonUrn(accessToken),
    ).pipe(Effect.provide(PlatformServicesLive)),
  );
}

export async function postToLinkedIn(params: {
  accessToken: string;
  authorUrn: string;
  text: string;
}): Promise<{ postId: string }> {
  return Effect.runPromise(
    Effect.flatMap(LinkedInService, (service) => service.post(params)).pipe(
      Effect.provide(PlatformServicesLive),
    ),
  );
}
