import "server-only";

export interface XPostResponse {
  data: {
    id: string;
    text: string;
  };
}

export interface XErrorResponse {
  errors?: Array<{ message: string; code: number }>;
  title?: string;
  detail?: string;
}

export async function postToX(params: {
  accessToken: string;
  text: string;
  replyToTweetId?: string;
}): Promise<XPostResponse> {
  const { accessToken, text, replyToTweetId } = params;

  const body: Record<string, unknown> = { text };
  if (replyToTweetId) {
    body.reply = { in_reply_to_tweet_id: replyToTweetId };
  }

  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error: XErrorResponse = await response.json().catch(() => ({}));
    const message =
      error.errors?.[0]?.message ||
      error.title ||
      error.detail ||
      `X API error: ${response.status}`;

    if (response.status === 429) {
      const retryAfter = response.headers.get("x-rate-limit-reset");
      throw new Error(
        `Rate limit exceeded. ${retryAfter ? `Retry after ${new Date(Number(retryAfter) * 1000).toLocaleString()}` : "Please try again later."}`,
      );
    }

    if (response.status === 401) {
      throw new Error(
        "Authentication failed. Please reconnect your X account.",
      );
    }

    if (response.status === 403) {
      throw new Error(
        "Forbidden: Your X account may not have the required permissions. Please disconnect and reconnect your X account in Settings to grant posting permissions.",
      );
    }

    throw new Error(message);
  }

  return response.json() as Promise<XPostResponse>;
}

export interface LinkedInPostResponse {
  id?: string;
}

export async function getLinkedInPersonUrn(
  accessToken: string,
): Promise<string> {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      error.error_description ||
        `Failed to fetch LinkedIn user info: ${response.status}`,
    );
  }

  const data = await response.json();
  // LinkedIn returns sub field which is the person ID
  // Format: urn:li:person:{id}
  if (data.sub) {
    return data.sub.startsWith("urn:li:person:")
      ? data.sub
      : `urn:li:person:${data.sub}`;
  }

  throw new Error("LinkedIn user info did not contain person URN");
}

export async function postToLinkedIn(params: {
  accessToken: string;
  authorUrn: string;
  text: string;
}): Promise<{ postId: string }> {
  const { accessToken, authorUrn, text } = params;

  const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
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
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      error.message ||
      error.errorDetails ||
      `LinkedIn API error: ${response.status}`;

    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    if (response.status === 401) {
      throw new Error(
        "Authentication failed. Please reconnect your LinkedIn account.",
      );
    }

    throw new Error(message);
  }

  // LinkedIn returns post ID in X-RestLi-Id header
  const postId = response.headers.get("X-RestLi-Id");
  if (!postId) {
    throw new Error("LinkedIn API did not return a post ID");
  }

  return { postId };
}
