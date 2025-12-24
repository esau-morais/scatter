import "server-only";
import * as Layer from "effect/Layer";
import { LinkedInServiceLive } from "./linkedin";
import { XServiceLive } from "./x";

export * from "./linkedin";
export * from "./x";

export const PlatformServicesLive = Layer.merge(
  XServiceLive,
  LinkedInServiceLive,
);
