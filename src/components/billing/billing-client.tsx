"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useTRPC } from "@/lib/trpc/client";
import { PricingPlans } from "./pricing-plans";

export function BillingClient() {
  const trpc = useTRPC();
  const { data: subscriptionData, isLoading } = useQuery(
    trpc.billing.getSubscription.queryOptions(),
  );

  if (isLoading) {
    return (
      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8 min-h-[50vh] flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading plans...</p>
      </main>
    );
  }

  const currentPlanId = subscriptionData?.currentPlanId;

  return (
    <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div>
          <h1 className="text-2xl font-bold">Billing & Plans</h1>
          <p className="text-muted-foreground">
            Manage your subscription and view available plans.
          </p>
        </div>

        <PricingPlans currentPlanId={currentPlanId} />
      </motion.div>
    </main>
  );
}
