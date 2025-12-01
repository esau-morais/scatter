"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RecentSeeds } from "@/components/dashboard/recent-seeds";
import { SeedInput } from "@/components/dashboard/seed-input";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TransformOutput } from "@/components/dashboard/transform-output";
import type { Seed, Transformation } from "@/db/schema";
import { useTRPC } from "@/lib/trpc/client";

type SeedHistoryItem = {
  seed: Seed;
  transformations: Transformation[];
};

export function DashboardClient() {
  const trpc = useTRPC();
  const [seedHistory, setSeedHistory] = useState<SeedHistoryItem[]>([]);
  const [latestGeneration, setLatestGeneration] =
    useState<SeedHistoryItem | null>(null);

  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  const { data: initialHistory } = useQuery(trpc.seeds.list.queryOptions());

  useEffect(() => {
    if (initialHistory) {
      setSeedHistory(initialHistory);
    }
  }, [initialHistory]);

  const generateMutation = useMutation(
    trpc.transformations.generate.mutationOptions({
      onSuccess: (data) => {
        setLatestGeneration(data);
        setSeedHistory((prev) => [data, ...prev]);
      },
      onError: (error) => {
        console.error("Failed to generate transformations:", error);
        setLatestGeneration(null);
      },
    }),
  );

  const markAsPostedMutation = useMutation(
    trpc.transformations.markAsPosted.mutationOptions({
      onSuccess: (updatedTransformation) => {
        const updateState = (item: SeedHistoryItem) => ({
          ...item,
          transformations: item.transformations.map((t) =>
            t.id === updatedTransformation.id ? updatedTransformation : t,
          ),
        });

        setLatestGeneration((prev) => {
          if (!prev || prev.seed.id !== updatedTransformation.seedId)
            return prev;
          return updateState(prev);
        });

        setSeedHistory((prevHistory) =>
          prevHistory.map((item) => {
            if (item.seed.id === updatedTransformation.seedId) {
              return updateState(item);
            }
            return item;
          }),
        );
      },
    }),
  );

  const handleGenerate = (content: string, platforms: string[]) => {
    setLatestGeneration(null);
    generateMutation.mutate({
      content,
      platforms: platforms as ("x" | "linkedin" | "tiktok" | "blog")[],
    });
  };

  const handleMarkAsPosted = (id: string, posted: boolean) => {
    markAsPostedMutation.mutate({ id, posted });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 h-60 w-60 rounded-full bg-chart-2/20 blur-[100px]" />
      </div>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        {!view ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <StatsCards history={seedHistory} />
            <div className="grid gap-6 lg:grid-cols-2">
              <SeedInput
                onGenerate={handleGenerate}
                isGenerating={generateMutation.isPending}
              />
              <TransformOutput
                transformations={latestGeneration?.transformations ?? []}
                isGenerating={generateMutation.isPending}
                onMarkAsPosted={handleMarkAsPosted}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <RecentSeeds history={seedHistory} />
          </motion.div>
        )}
      </main>
    </div>
  );
}
