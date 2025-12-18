"use client";

import { useQuery } from "@tanstack/react-query";
import { CreditCard, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/lib/trpc/client";

export function ManageSubscription() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.billing.getSubscription.queryOptions(),
  );

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/50 p-6 backdrop-blur-sm">
        <div className="mb-6">
          <Skeleton className="mb-2 h-5 w-28" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/50 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div>
              <Skeleton className="mb-1 h-4 w-20" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </Card>
    );
  }

  const planLabel =
    data?.plan === "pro"
      ? "Pro"
      : data?.plan === "creator"
        ? "Creator"
        : "Free";
  const hasSubscription = !!data?.polarCustomerId;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Subscription</h2>
        <p className="text-sm text-muted-foreground">
          Manage your billing and subscription
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/50 p-4"
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
            <CreditCard className="size-5" />
          </div>
          <div>
            <p className="font-medium">{planLabel} Plan</p>
            <p className="text-xs text-muted-foreground">
              {hasSubscription
                ? "Manage billing, update payment method, or cancel"
                : "No active subscription"}
            </p>
          </div>
        </div>

        {hasSubscription && (
          <Button variant="outline" size="sm" asChild>
            <a href="/api/portal" target="_blank" rel="noopener">
              Manage
              <ExternalLink className="ml-2 size-3" />
            </a>
          </Button>
        )}
      </motion.div>
    </div>
  );
}
