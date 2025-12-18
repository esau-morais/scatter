import type { TRPCClientErrorLike } from "@trpc/client";
import type { InferrableClientTypes } from "@trpc/server/unstable-core-do-not-import";

export function getErrorMessage<T extends InferrableClientTypes>(
  error: TRPCClientErrorLike<T>,
): string {
  const zodError = error.data?.zodError;

  if (zodError) {
    const fieldErrors = Object.entries(zodError.fieldErrors)
      .map(([_field, messages]) => messages)
      .filter(Boolean) as string[];

    if (fieldErrors.length > 0) {
      return fieldErrors[0];
    }

    if (zodError.formErrors.length > 0) {
      return zodError.formErrors[0];
    }
  }

  return error.message;
}
