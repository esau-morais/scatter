export const getCharacterCount = (content: string) => content.length;

export const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} mins ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return date.toLocaleDateString();
};

export const getCharLimitStatus = (charCount: number, maxChars: number) => {
  const isOverLimit = charCount > maxChars;
  const isNearLimit = charCount > maxChars * 0.9;
  return { isOverLimit, isNearLimit };
};
