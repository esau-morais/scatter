"use client";

import { toast } from "sonner";
import { getUserFacingTRPCErrorMessage } from "./errors";

export function toastTRPCError(
  error: unknown,
  opts?: { title?: string; description?: string },
) {
  const formatted = getUserFacingTRPCErrorMessage(error);
  toast.error(opts?.title ?? formatted.title, {
    description: opts?.description ?? formatted.description,
  });
}
