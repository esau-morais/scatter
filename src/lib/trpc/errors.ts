import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@/server/routers";

export type AppTRPCClientError = TRPCClientErrorLike<AppRouter>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function getTRPCErrorCode(error: unknown): string | undefined {
  if (!isObject(error)) return undefined;

  const data = isObject(error.data) ? error.data : undefined;
  const code = typeof data?.code === "string" ? data.code : undefined;
  if (code) return code;

  const shape = isObject(error.shape) ? error.shape : undefined;
  const shapeData = isObject(shape?.data) ? shape.data : undefined;
  return typeof shapeData?.code === "string" ? shapeData.code : undefined;
}

export function getTRPCZodIssueMessage(error: unknown): string | undefined {
  if (!isObject(error)) return undefined;
  const data = isObject(error.data) ? error.data : undefined;
  const zodError = isObject(data?.zodError) ? data.zodError : undefined;
  const fieldErrors = isObject(zodError?.fieldErrors)
    ? zodError.fieldErrors
    : undefined;

  if (fieldErrors) {
    for (const key of Object.keys(fieldErrors)) {
      const val = fieldErrors[key];
      if (Array.isArray(val) && typeof val[0] === "string") return val[0];
    }
  }

  const formErrors = zodError?.formErrors;
  if (Array.isArray(formErrors) && typeof formErrors[0] === "string") {
    return formErrors[0];
  }

  return undefined;
}

export function getUserFacingTRPCErrorMessage(error: unknown) {
  const code = getTRPCErrorCode(error);
  const zodIssue = getTRPCZodIssueMessage(error);
  const message = error instanceof Error ? error.message : undefined;

  if (zodIssue) {
    return { title: "Check your input", description: zodIssue, code };
  }

  switch (code) {
    case "TOO_MANY_REQUESTS":
      return {
        title: "Rate limit exceeded",
        description: "Please wait a bit and try again.",
        code,
      };
    case "UNAUTHORIZED":
      return {
        title: "Please sign in",
        description: "Your session expired.",
        code,
      };
    case "FORBIDDEN":
      return { title: "Not allowed", description: message, code };
    case "NOT_FOUND":
      return { title: "Not found", description: message, code };
    case "CONFLICT":
      return { title: "Already exists", description: message, code };
    case "BAD_REQUEST":
      return { title: "Invalid request", description: message, code };
    default:
      return {
        title: "Something went wrong",
        description: message,
        code,
      };
  }
}
