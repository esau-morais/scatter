import { beforeAll, describe, expect, mock, test } from "bun:test";
import twitterText from "twitter-text";

// `src/server/lib/thread-splitter.ts` imports `server-only`, which intentionally throws at runtime
// outside of Next's bundler. For unit tests, we mock it to a no-op.
mock.module("server-only", () => ({}));

let splitXThread: typeof import("./thread-splitter").splitXThread;

beforeAll(async () => {
  ({ splitXThread } = await import("./thread-splitter"));
});

function xWeightedLength(text: string) {
  return twitterText.parseTweet(text.normalize("NFC")).weightedLength;
}

describe("thread-splitter", () => {
  test("truncates an overlong sentence even when it comes after a flushed chunk", () => {
    const longSentence = `${"a".repeat(300)}.`;
    const input = `Short. ${longSentence}`;

    const tweets = splitXThread(input);

    expect(tweets.length).toBe(2);
    expect(tweets[0]).toBe("Short.");
    expect(xWeightedLength(tweets[1])).toBeLessThanOrEqual(280);
    expect(tweets[1].endsWith("...")).toBe(true);
  });

  test("never returns a tweet longer than 280 characters", () => {
    const veryLong = `${"b".repeat(600)}.`;
    const input = `Intro. ${veryLong} Outro.`;

    const tweets = splitXThread(input);

    expect(tweets.length).toBeGreaterThan(0);
    for (const t of tweets) {
      expect(t.length).toBeGreaterThan(0);
      expect(xWeightedLength(t)).toBeLessThanOrEqual(280);
    }
  });

  test("splits numbered thread-style content into separate tweets", () => {
    const input = `1/ First point\n2/ Second point\n3/ Third point`;
    const tweets = splitXThread(input);
    expect(tweets).toEqual(["First point", "Second point", "Third point"]);
  });

  test("splits bullet lists into separate tweets", () => {
    const input = `- Alpha\n- Beta\n- Gamma`;
    const tweets = splitXThread(input);
    expect(tweets).toEqual(["Alpha", "Beta", "Gamma"]);
  });

  test("handles a single overlong unbroken word by truncating", () => {
    const input = `Intro.\n\n${"x".repeat(400)}`;
    const tweets = splitXThread(input);
    expect(tweets.length).toBe(2);
    expect(tweets[0]).toBe("Intro.");
    expect(xWeightedLength(tweets[1])).toBeLessThanOrEqual(280);
    expect(tweets[1].endsWith("...")).toBe(true);
  });

  test("uses X weighted counting (CJK characters count as 2)", () => {
    // "漢" is outside the single-weight ranges and counts as 2.
    const tokens = Array.from({ length: 94 }, () => "漢").join(" ");
    const tweets = splitXThread(tokens);

    // 94 tokens would be 281 weighted (94*2 + 93 spaces), so it must split.
    expect(tweets.length).toBe(2);
    expect(tweets[0].split(" ").length).toBe(93);
    expect(xWeightedLength(tweets[0])).toBeLessThanOrEqual(280);
    expect(xWeightedLength(tweets[1])).toBeLessThanOrEqual(280);
  });

  test("uses X weighted counting (URLs count as 23 regardless of displayed length)", () => {
    // X counts any URL as 23 characters via t.co wrapping.
    // https://docs.x.com/fundamentals/counting-characters
    const urls = Array.from({ length: 12 }, () => "https://x.com/a").join(" ");
    const tweets = splitXThread(urls);

    // 12 URLs would be 287 weighted (12*23 + 11 spaces), so it must split.
    expect(tweets.length).toBe(2);
    expect(tweets[0].split(" ").length).toBe(11);
    expect(xWeightedLength(tweets[0])).toBeLessThanOrEqual(280);
    expect(xWeightedLength(tweets[1])).toBeLessThanOrEqual(280);
  });

  test("throws when the thread exceeds 25 tweets", () => {
    const parts = Array.from({ length: 26 }, (_, i) => `${i + 1}/ item`);
    expect(() => splitXThread(parts.join("\n"))).toThrow(
      "Thread too long: 26 tweets (max 25)",
    );
  });
});
