import { Webhooks } from "@polar-sh/nextjs";
import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/lib/auth/auth-schema";

const PLAN_IDS = {
  creator: "cca63744-a831-4534-8af6-38d1a08d2f29",
  pro: "789-ghi-012-jkl",
} as const;

const getPlanFromId = (planId: string): "creator" | "pro" | "free" => {
  if (planId === PLAN_IDS.creator) return "creator";
  if (planId === PLAN_IDS.pro) return "pro";
  return "free";
};

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    switch (payload.type) {
      case "subscription.created":
      case "subscription.updated": {
        const subscription = payload.data;
        const customer = subscription.customer;
        const plan = getPlanFromId(subscription.product.id);

        // Match by polarCustomerId first, then fallback to email
        await db
          .update(user)
          .set({
            plan: plan,
            polarCustomerId: customer.id,
            polarSubscriptionId: subscription.id,
          })
          .where(
            or(
              eq(user.polarCustomerId, customer.id),
              eq(user.email, customer.email),
            ),
          );

        console.log(
          `Updated subscription for customer ${customer.id} to plan ${plan}`,
        );
        break;
      }
      case "subscription.canceled": {
        const subscription = payload.data;
        const customer = subscription.customer;

        await db
          .update(user)
          .set({
            plan: "free",
            polarSubscriptionId: null,
          })
          .where(
            or(
              eq(user.polarCustomerId, customer.id),
              eq(user.email, customer.email),
            ),
          );

        console.log(`Cancelled subscription for customer ${customer.id}`);
        break;
      }
      default:
        console.log(`Received unhandled Polar event type: ${payload.type}`);
    }
  },
});
