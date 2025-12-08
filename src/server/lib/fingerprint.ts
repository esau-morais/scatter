import { createHash } from "node:crypto";

export function getFingerprint(headers: Headers): string {
  const ip = headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const ua = headers.get("user-agent") || "";
  const lang = headers.get("accept-language") || "";

  return createHash("sha256").update(`${ip}|${ua}|${lang}`).digest("hex");
}
