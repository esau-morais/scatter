import { router } from "../trpc";
import { billingRouter } from "./billing";
import { waitlistRouter } from "./waitlist";

export const appRouter = router({
  billing: billingRouter,
  waitlist: waitlistRouter,
});

export type AppRouter = typeof appRouter;
