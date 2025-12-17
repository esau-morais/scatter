import "server-only";

import twitterText from "twitter-text";

const DEFAULT_MAX_TWEET_LENGTH = 280;
const DEFAULT_MAX_THREAD_LENGTH = 25;

type SplitOptions = {
  maxTweetLength?: number;
  maxThreadLength?: number;
};

function xWeightedLength(input: string) {
  // X counts using NFC normalization.
  // https://docs.x.com/fundamentals/counting-characters
  return twitterText.parseTweet(input.normalize("NFC")).weightedLength;
}

function fitsInTweet(input: string, maxLen: number) {
  return xWeightedLength(input) <= maxLen;
}

function graphemeSegments(input: string): string[] {
  // Keep emoji ZWJ sequences intact when truncating.
  const Segmenter = Intl.Segmenter as
    | undefined
    | (new (
        locales?: string | string[],
        options?: Intl.SegmenterOptions,
      ) => Intl.Segmenter);
  if (!Segmenter) return Array.from(input); // fallback: code points
  const segmenter = new Segmenter(undefined, { granularity: "grapheme" });
  return Array.from(segmenter.segment(input), (s) => s.segment);
}

function normalizeNewlines(input: string) {
  return input.replaceAll("\r\n", "\n").replaceAll("\r", "\n").trim();
}

function normalizeWhitespace(input: string) {
  return input.replaceAll(/\s+/g, " ").trim();
}

function stripLeadingListPrefix(line: string) {
  // "1.", "2/", etc (common thread formatting), plus basic bullets.
  return line
    .replace(/^\s*\d+\s*(?:[./]|\s*\/)\s+/, "")
    .replace(/^\s*[-*•]\s+/, "")
    .trim();
}

type BlockSplitMode = "list" | "paragraphs";

function splitIntoBlocks(content: string): {
  mode: BlockSplitMode;
  blocks: string[];
} {
  const text = normalizeNewlines(content);
  if (!text) return { mode: "paragraphs", blocks: [] };

  const lines = text.split("\n");
  const numberedRe = /^\s*\d+\s*(?:[./]|\s*\/)\s+/;
  const bulletRe = /^\s*[-*•]\s+/;

  const numberedCount = lines.filter((l) => numberedRe.test(l)).length;
  const bulletCount = lines.filter((l) => bulletRe.test(l)).length;

  // Prefer structured splitting when it's clearly a list.
  if (numberedCount >= 2) {
    const blocks: string[] = [];
    let current: string[] = [];

    for (const line of lines) {
      if (numberedRe.test(line)) {
        if (current.length) blocks.push(current.join("\n"));
        current = [stripLeadingListPrefix(line)];
      } else if (line.trim().length === 0) {
        // Keep blank lines as a soft separator inside the same block.
        if (current.length) current.push("");
      } else if (current.length) {
        current.push(line);
      }
    }

    if (current.length) blocks.push(current.join("\n"));
    return {
      mode: "list",
      blocks: blocks.map((b) => b.trim()).filter(Boolean),
    };
  }

  if (bulletCount >= 2) {
    const blocks: string[] = [];
    let current: string[] = [];

    for (const line of lines) {
      if (bulletRe.test(line)) {
        if (current.length) blocks.push(current.join("\n"));
        current = [stripLeadingListPrefix(line)];
      } else if (line.trim().length === 0) {
        if (current.length) current.push("");
      } else if (current.length) {
        current.push(line);
      }
    }

    if (current.length) blocks.push(current.join("\n"));
    return {
      mode: "list",
      blocks: blocks.map((b) => b.trim()).filter(Boolean),
    };
  }

  // Default: paragraphs.
  return {
    mode: "paragraphs",
    blocks: text
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean),
  };
}

function splitBySentences(input: string): string[] {
  const text = normalizeWhitespace(input);
  if (!text) return [];

  // Approximate sentence boundary splitter (keeps punctuation with the sentence).
  const parts: string[] = [];
  let cursor = 0;
  const re = /[.!?]+(?=\s+|$)/g;
  let match: RegExpExecArray | null = re.exec(text);
  while (match !== null) {
    const end = match.index + match[0].length;
    const sentence = text.slice(cursor, end).trim();
    if (sentence) parts.push(sentence);
    cursor = end;
    match = re.exec(text);
  }
  const rest = text.slice(cursor).trim();
  if (rest) parts.push(rest);
  return parts;
}

function truncateWithEllipsis(input: string, maxLen: number) {
  const text = input.normalize("NFC");
  if (fitsInTweet(text, maxLen)) return text;
  if (maxLen <= 3) return ".".repeat(Math.max(0, maxLen));

  const ellipsis = "...";
  const segments = graphemeSegments(text);

  // Find the longest prefix where (prefix + "...") still fits, by weighted length.
  let lo = 0;
  let hi = segments.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const candidate = `${segments.slice(0, mid).join("")}${ellipsis}`;
    if (fitsInTweet(candidate, maxLen)) lo = mid;
    else hi = mid - 1;
  }

  return `${segments.slice(0, lo).join("")}${ellipsis}`;
}

function chunkByWords(input: string, maxLen: number): string[] {
  const text = normalizeWhitespace(input);
  if (!text) return [];

  const words = text.split(" ").filter(Boolean);
  const out: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = fitsInTweet(word, maxLen)
        ? word
        : truncateWithEllipsis(word, maxLen);
      continue;
    }

    const candidate = `${current} ${word}`;
    if (fitsInTweet(candidate, maxLen)) {
      current = candidate;
    } else {
      out.push(current);
      current = fitsInTweet(word, maxLen)
        ? word
        : truncateWithEllipsis(word, maxLen);
    }
  }

  if (current) out.push(current);
  return out;
}

function chunkBlock(input: string, maxLen: number): string[] {
  const text = normalizeWhitespace(input);
  if (!text) return [];
  if (fitsInTweet(text, maxLen)) return [text];

  // Prefer sentence packing, then fall back to word chunking.
  const sentences = splitBySentences(text);
  if (sentences.length <= 1) return chunkByWords(text, maxLen);

  const out: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (!current) {
      if (fitsInTweet(sentence, maxLen)) {
        current = sentence;
      } else {
        out.push(...chunkByWords(sentence, maxLen));
      }
      continue;
    }

    const candidate = `${current} ${sentence}`;
    if (fitsInTweet(candidate, maxLen)) {
      current = candidate;
    } else {
      out.push(current);
      if (fitsInTweet(sentence, maxLen)) {
        current = sentence;
      } else {
        out.push(...chunkByWords(sentence, maxLen));
        current = "";
      }
    }
  }

  if (current) out.push(current);
  return out;
}

export function splitXThread(
  content: string,
  opts: SplitOptions = {},
): string[] {
  const maxTweetLength = opts.maxTweetLength ?? DEFAULT_MAX_TWEET_LENGTH;
  const maxThreadLength = opts.maxThreadLength ?? DEFAULT_MAX_THREAD_LENGTH;

  const { blocks } = splitIntoBlocks(content);

  const normalizedBlocks = blocks
    .map((b) => stripLeadingListPrefix(b))
    .map((b) => normalizeWhitespace(b))
    .filter(Boolean);

  // Preserve the user's "explicit splits" (lists/paragraphs) as tweet boundaries.
  const tweets = normalizedBlocks.flatMap((block) =>
    chunkBlock(block, maxTweetLength),
  );

  if (tweets.length === 0) throw new Error("No valid tweets found in content");
  if (tweets.length > maxThreadLength) {
    throw new Error(
      `Thread too long: ${tweets.length} tweets (max ${maxThreadLength})`,
    );
  }

  // Final safety: make sure we never hand the X API an over-limit tweet.
  return tweets.map((t) => truncateWithEllipsis(t, maxTweetLength));
}
