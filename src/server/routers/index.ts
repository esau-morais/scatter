import { router } from "../trpc";
import { waitlistRouter } from "./waitlist";

export const appRouter = router({
  waitlist: waitlistRouter,
});

export type AppRouter = typeof appRouter;
