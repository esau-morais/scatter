import { z } from "zod";

const STORAGE_KEY = "scatter_try_result";

export const guestTransformationSchema = z.object({
  id: z.string(),
  platform: z.enum(["x", "linkedin", "tiktok", "blog"]),
  content: z.string(),
  seedId: z.null(),
  postedAt: z.null(),
  createdAt: z.coerce.date(),
});

export const demoResultSchema = z.object({
  content: z.string(),
  transformations: z.array(guestTransformationSchema),
});

export type GuestTransformation = z.infer<typeof guestTransformationSchema>;
export type DemoResult = z.infer<typeof demoResultSchema>;

export function getDemoFromStorage(): DemoResult | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    return demoResultSchema.parse(parsed);
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveDemoToStorage(data: DemoResult): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearDemoFromStorage(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
