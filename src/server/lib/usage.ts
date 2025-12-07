import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { usageStats } from "@/db/schema";

export function getStartOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getCurrentMonthUsage(userId: string) {
  const month = getStartOfMonth();

  const stats = await db.query.usageStats.findFirst({
    where: and(eq(usageStats.userId, userId), eq(usageStats.month, month)),
  });

  return (
    stats ?? {
      seedsCreated: 0,
      transformationsCreated: 0,
      transformationsPosted: 0,
      freeSeedsCreated: 0,
      freeTransformationsCreated: 0,
    }
  );
}

export const USAGE_LIMITS: Record<string, number | null> = {
  free: 10,
  creator: 100,
  pro: null,
};
