"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import type { Seed, Transformation } from "@/db/schema";
import { useTRPC } from "@/lib/trpc/client";

type SeedHistoryItem = {
  seed: Seed;
  transformations: Transformation[];
};

interface StatsCardsProps {
  history: SeedHistoryItem[];
}

export function StatsCards({ history = [] }: StatsCardsProps) {
  const trpc = useTRPC();
  const hasData = history.length > 0;

  const { data: usageData } = useQuery(
    trpc.transformations.getUsage.queryOptions(),
  );

  const calculatedStats = useMemo(() => {
    const totalTransformations = history.reduce(
      (acc, item) => acc + item.transformations.length,
      0,
    );
    const postedTransformations = history.reduce(
      (acc, item) =>
        acc + item.transformations.filter((t) => t.postedAt !== null).length,
      0,
    );
    const successRate =
      totalTransformations > 0
        ? Math.round((postedTransformations / totalTransformations) * 100)
        : 0;

    return {
      seedsCreated: history.length,
      totalTransformations,
      successRate,
    };
  }, [history]);

  const getUsageSubtitle = () => {
    if (!usageData) return "Loading...";
    if (usageData.limit === null) {
      return "Unlimited this month";
    }
    if (usageData.remaining === null) {
      return `${usageData.limit} included in your plan`;
    }
    return `${usageData.remaining} remaining this month`;
  };

  const stats = [
    {
      label: "Transformations",
      value: calculatedStats.totalTransformations,
      emptyValue: "0",
      subtitle: getUsageSubtitle(),
      emptySubtitle:
        usageData?.limit === null
          ? "Unlimited"
          : `${usageData?.limit ?? "—"} included in your plan`,
      icon: Sparkles,
      color: "text-primary",
    },
    {
      label: "Seeds Created",
      value: calculatedStats.seedsCreated,
      emptyValue: "0",
      subtitle: "This month",
      emptySubtitle: "Start transforming to track",
      icon: FileText,
      color: "text-chart-3",
    },
    {
      label: "Success Rate",
      value: `${calculatedStats.successRate}%`,
      emptyValue: "--",
      subtitle: "Posted to platforms",
      emptySubtitle: "No data yet",
      icon: TrendingUp,
      color: "text-chart-2",
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
            className={`border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all ${!hasData ? "opacity-60" : ""}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p
                  className={`mt-2 text-3xl font-bold ${!hasData ? "text-muted-foreground" : ""}`}
                >
                  {hasData ? stat.value : stat.emptyValue}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {hasData ? stat.subtitle : stat.emptySubtitle}
                </p>
              </div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-secondary ${hasData ? stat.color : "text-muted-foreground"}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
