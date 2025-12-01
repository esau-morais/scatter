import { router } from "../trpc";
import { billingRouter } from "./billing";
import { seedsRouter } from "./seeds";
import { transformationsRouter } from "./transformations";
import { waitlistRouter } from "./waitlist";

export const appRouter = router({
  billing: billingRouter,
  seeds: seedsRouter,
  transformations: transformationsRouter,
  waitlist: waitlistRouter,
});

export type AppRouter = typeof appRouter;
