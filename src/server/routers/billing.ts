import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/lib/auth/auth-schema";
import { polar } from "@/lib/polar";
import { protectedProcedure, router } from "../trpc";

export const billingRouter = router({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        plan: true,
        polarCustomerId: true,
        polarSubscriptionId: true,
      },
    });

    if (!currentUser) {
      return { currentPlanId: undefined };
    }

    // If user has a subscription, fetch the product ID from Polar
    let currentPlanId: string | undefined;

    if (currentUser.polarSubscriptionId) {
      try {
        const subscription = await polar.subscriptions.get({
          id: currentUser.polarSubscriptionId,
        });
        currentPlanId = subscription.product.id;
      } catch (error) {
        console.error("Failed to fetch subscription from Polar:", error);
      }
    }

    return {
      currentPlanId,
      plan: currentUser.plan,
      polarCustomerId: currentUser.polarCustomerId,
    };
  }),
});
