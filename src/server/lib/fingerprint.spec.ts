import { describe, expect, test } from "bun:test";
import { getFingerprint } from "./fingerprint";

describe("fingerprint", () => {
  test("generates consistent hash for same inputs", () => {
    const headers = new Headers({
      "x-forwarded-for": "192.168.1.1",
      "user-agent": "Mozilla/5.0",
      "accept-language": "en-US",
    });

    const fp1 = getFingerprint(headers);
    const fp2 = getFingerprint(headers);

    expect(fp1).toBe(fp2);
    expect(fp1).toHaveLength(64);
  });

  test("generates different hashes for different IPs", () => {
    const headers1 = new Headers({
      "x-forwarded-for": "192.168.1.1",
      "user-agent": "Mozilla/5.0",
      "accept-language": "en-US",
    });

    const headers2 = new Headers({
      "x-forwarded-for": "192.168.1.2",
      "user-agent": "Mozilla/5.0",
      "accept-language": "en-US",
    });

    expect(getFingerprint(headers1)).not.toBe(getFingerprint(headers2));
  });

  test("handles missing headers", () => {
    const headers = new Headers();
    const fp = getFingerprint(headers);

    expect(fp).toHaveLength(64);
  });

  test("extracts first IP from x-forwarded-for chain", () => {
    const headers1 = new Headers({
      "x-forwarded-for": "203.0.113.1, 198.51.100.1, 192.0.2.1",
    });

    const headers2 = new Headers({
      "x-forwarded-for": "203.0.113.1",
    });

    expect(getFingerprint(headers1)).toBe(getFingerprint(headers2));
  });

  test("uses 'local' as default IP", () => {
    const headers = new Headers({
      "user-agent": "Mozilla/5.0",
      "accept-language": "en-US",
    });

    const fp = getFingerprint(headers);
    expect(fp).toHaveLength(64);
  });
});
