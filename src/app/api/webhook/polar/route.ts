import { Webhooks } from "@polar-sh/nextjs";
import { eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/lib/auth/auth-schema";
import { PLAN_IDS } from "@/lib/polar/plans";

const getPlanFromId = (planId: string): "creator" | "pro" | "free" => {
  if (planId === PLAN_IDS.creator) return "creator";
  if (planId === PLAN_IDS.pro) return "pro";
  return "free";
};

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    try {
      switch (payload.type) {
        case "subscription.created":
        case "subscription.updated": {
          const subscription = payload.data;
          const customer = subscription.customer;
          const plan = getPlanFromId(subscription.product.id);

          console.log(
            `Processing ${payload.type} for customer ${customer.id}, email: ${customer.email}, plan: ${plan}`,
          );

          // Match by polarCustomerId first, then fallback to case-insensitive email
          const result = await db
            .update(user)
            .set({
              plan: plan,
              polarCustomerId: customer.id,
              polarSubscriptionId: subscription.id,
            })
            .where(
              or(
                eq(user.polarCustomerId, customer.id),
                sql`LOWER(${user.email}) = LOWER(${customer.email})`,
              ),
            );

          if (result.rowCount === 0) {
            console.error(
              `No user found for customer ${customer.id} with email ${customer.email}`,
            );
          } else {
            console.log(
              `Updated subscription for customer ${customer.id} to plan ${plan}`,
            );
          }
          break;
        }
        case "subscription.canceled": {
          const subscription = payload.data;
          const customer = subscription.customer;

          console.log(`Processing subscription.canceled for customer ${customer.id}`);

          const result = await db
            .update(user)
            .set({
              plan: "free",
              polarSubscriptionId: null,
            })
            .where(
              or(
                eq(user.polarCustomerId, customer.id),
                sql`LOWER(${user.email}) = LOWER(${customer.email})`,
              ),
            );

          if (result.rowCount === 0) {
            console.error(
              `No user found for customer ${customer.id} with email ${customer.email}`,
            );
          } else {
            console.log(`Cancelled subscription for customer ${customer.id}`);
          }
          break;
        }
        default:
          console.log(`Received unhandled Polar event type: ${payload.type}`);
      }
    } catch (error) {
      console.error("Error processing Polar webhook:", error);
      throw error;
    }
  },
});
