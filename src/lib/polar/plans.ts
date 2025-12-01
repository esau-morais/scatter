import type { SDKOptions } from "@polar-sh/sdk";

const PLAN_IDS_SANDBOX = {
  creator: "cca63744-a831-4534-8af6-38d1a08d2f29",
  pro: "4d216882-c6fa-4f19-bc5e-2e33446197e2",
};

const PLAN_IDS_PRODUCTION = {
  creator: "89230850-a3e4-4b82-bc07-4dbafaeafd7f",
  pro: "35274989-26a4-4fe9-9d24-134af6faf197",
};

type ServerEnvironment = SDKOptions["server"];

function getEnvironment(): ServerEnvironment {
  if (typeof window === "undefined") {
    return (process.env.POLAR_ENVIRONMENT as ServerEnvironment) || "sandbox";
  }
  return (
    (process.env.NEXT_PUBLIC_POLAR_ENVIRONMENT as ServerEnvironment) ||
    "sandbox"
  );
}

const environment = getEnvironment();

export const PLAN_IDS =
  environment === "production" ? PLAN_IDS_PRODUCTION : PLAN_IDS_SANDBOX;
