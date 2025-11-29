import "server-only";

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import {
  createTRPCOptionsProxy,
  type TRPCQueryOptions,
} from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import { cache, type ReactNode } from "react";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import type { AppRouter } from "@/server/routers";
import { appRouter } from "@/server/routers";
import { makeQueryClient } from "./query-client";

const createContext = cache(async () => {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  return {
    session,
    db,
  };
});

// IMPORTANT: Create a stable getter for the query client that
//            will return the same client during the same request.
export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy<AppRouter>({
  ctx: createContext,
  router: appRouter,
  queryClient: getQueryClient,
});

export function HydrateClient(props: { children: ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const queryClient = getQueryClient();
  if (queryOptions.queryKey[1]?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions);
  }
}
