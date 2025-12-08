"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import { useTRPC } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export function StatsCards() {
  const trpc = useTRPC();
  const { data, isLoading } = useQuery(
    trpc.transformations.getDashboardData.queryOptions(),
  );

  const hasData = (data?.totalTransformations ?? 0) > 0;
  const usageSubtitle = isLoading
    ? "Loading..."
    : data
      ? data.limit === null
        ? "Unlimited this month"
        : data.remaining === null
          ? `${data.limit} included in your plan`
          : `${data.remaining} remaining this month`
      : "";

  const stats = [
    {
      label: "Transformations",
      value: data?.totalTransformations ?? 0,
      emptyValue: "0",
      subtitle: usageSubtitle,
      emptySubtitle:
        data?.limit === null
          ? "Unlimited"
          : `${data?.limit ?? "—"} included in your plan`,
      icon: Sparkles,
    },
    {
      label: "Seeds Created",
      value: data?.seedsCreated ?? 0,
      emptyValue: "0",
      subtitle: "This month",
      emptySubtitle: "Start transforming to track",
      icon: FileText,
    },
    {
      label: "Success Rate",
      value: `${data?.successRate ?? 0}%`,
      emptyValue: "--",
      subtitle: "Posted to platforms",
      emptySubtitle: "No data yet",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card
            className={cn(
              "border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-border hover:shadow-lg",
              !hasData && "border-dashed",
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p
                  className={cn(
                    "mt-2 text-3xl font-bold tabular-nums tracking-tight",
                    hasData ? "text-foreground" : "text-muted-foreground/50",
                  )}
                >
                  {hasData ? stat.value : stat.emptyValue}
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    hasData
                      ? "text-muted-foreground"
                      : "text-muted-foreground/70",
                  )}
                >
                  {hasData ? stat.subtitle : stat.emptySubtitle}
                </p>
              </div>
              <motion.div
                className={cn(
                  "flex size-10 items-center justify-center rounded-lg bg-secondary transition-colors",
                  !hasData && "bg-secondary/50 text-muted-foreground/40",
                )}
                animate={
                  !hasData
                    ? {
                        scale: [1, 1.1, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              >
                <stat.icon className="size-5" />
              </motion.div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
