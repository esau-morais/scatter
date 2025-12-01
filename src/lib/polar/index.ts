import { Polar } from "@polar-sh/sdk";
import "server-only";

if (!process.env.POLAR_ACCESS_TOKEN) {
  throw new Error("POLAR_ACCESS_TOKEN is not set");
}

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server:
    (process.env.POLAR_ENVIRONMENT as "production" | "sandbox") || "sandbox",
});
