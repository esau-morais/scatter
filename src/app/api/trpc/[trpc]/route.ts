import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { headers } from "next/headers";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { appRouter } from "@/server/routers";

const handler = async (req: Request) => {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({ session, db }),
  });
};

export { handler as GET, handler as POST };
