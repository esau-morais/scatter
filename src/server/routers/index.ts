import { router } from "../trpc";
import { billingRouter } from "./billing";
import { guestRouter } from "./guest";
import { onboardingRouter } from "./onboarding";
import { seedsRouter } from "./seeds";
import { transformationsRouter } from "./transformations";
import { waitlistRouter } from "./waitlist";

export const appRouter = router({
  billing: billingRouter,
  guest: guestRouter,
  onboarding: onboardingRouter,
  seeds: seedsRouter,
  transformations: transformationsRouter,
  waitlist: waitlistRouter,
});

export type AppRouter = typeof appRouter;
