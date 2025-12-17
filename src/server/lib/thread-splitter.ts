import "server-only";

const MAX_TWEET_LENGTH = 280;
const MAX_THREAD_LENGTH = 25;

export function splitXThread(content: string): string[] {
  // Split on numbered patterns like "1.", "2.", "1/", "2/", or double newlines
  const patterns = [
    /^\d+[./]\s*/m, // "1.", "2/", etc.
    /\n\n+/g, // Double newlines
  ];

  let tweets: string[] = [];

  // First, try splitting by numbered patterns
  const numberedSplit = content.split(patterns[0]);
  if (numberedSplit.length > 1 && numberedSplit[0].trim().length === 0) {
    // Remove empty first element if split worked
    tweets = numberedSplit
      .slice(1)
      .map((t) => t.trim())
      .filter(Boolean);
  } else {
    // Fall back to double newline splitting
    tweets = content
      .split(/\n\n+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // Clean up any remaining numbering prefixes
  tweets = tweets.map((tweet) => {
    // Remove leading number patterns like "1.", "2/", etc.
    return tweet.replace(/^\d+[./]\s*/, "").trim();
  });

  // Validate each tweet length
  const validTweets: string[] = [];
  for (const tweet of tweets) {
    if (tweet.length === 0) continue;

    if (tweet.length > MAX_TWEET_LENGTH) {
      // Try to split long tweets by sentences
      const sentences = tweet.split(/([.!?]\s+)/);
      let currentTweet = "";

      for (let i = 0; i < sentences.length; i += 2) {
        const sentence = sentences[i] + (sentences[i + 1] || "");
        const candidate = currentTweet
          ? `${currentTweet} ${sentence}`
          : sentence;

        if (candidate.length <= MAX_TWEET_LENGTH) {
          currentTweet = candidate;
        } else {
          if (currentTweet) {
            validTweets.push(currentTweet.trim());
            currentTweet = sentence;
          } else {
            // Single sentence too long, truncate
            validTweets.push(
              `${sentence.substring(0, MAX_TWEET_LENGTH - 3)}...`,
            );
          }
        }
      }

      if (currentTweet) {
        validTweets.push(currentTweet.trim());
      }
    } else {
      validTweets.push(tweet);
    }
  }

  if (validTweets.length === 0) {
    throw new Error("No valid tweets found in content");
  }

  if (validTweets.length > MAX_THREAD_LENGTH) {
    throw new Error(
      `Thread too long: ${validTweets.length} tweets (max ${MAX_THREAD_LENGTH})`,
    );
  }

  return validTweets;
}
