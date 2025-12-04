import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/lib/auth/auth-schema";
import { polar } from "@/lib/polar";
import { protectedProcedure, router } from "../trpc";

export const billingRouter = router({
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const [currentUser] = await db
      .select({
        plan: users.plan,
        polarCustomerId: users.polarCustomerId,
        polarSubscriptionId: users.polarSubscriptionId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

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
