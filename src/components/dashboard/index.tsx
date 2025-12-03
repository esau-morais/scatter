"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { RecentSeeds } from "@/components/dashboard/recent-seeds";
import {
  SeedInput,
  type TransformOptions,
} from "@/components/dashboard/seed-input";
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
  const queryClient = useQueryClient();
  const seedsListOptions = trpc.seeds.list.queryOptions();
  const { data: seedHistory = [] } = useQuery(seedsListOptions);

  const [latestGeneration, setLatestGeneration] =
    useState<SeedHistoryItem | null>(null);

  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  const generateMutation = useMutation(
    trpc.transformations.generate.mutationOptions({
      onSuccess: async (data) => {
        setLatestGeneration(data);
        const currentHistory =
          queryClient.getQueryData(seedsListOptions.queryKey) ?? [];
        if (currentHistory.length === 0) {
          await confetti();
        }
        queryClient.setQueryData(seedsListOptions.queryKey, [
          data,
          ...currentHistory,
        ]);
        queryClient.invalidateQueries(
          trpc.transformations.getStats.queryOptions(),
        );
        queryClient.invalidateQueries(
          trpc.transformations.getUsage.queryOptions(),
        );
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
        const currentHistory =
          queryClient.getQueryData<SeedHistoryItem[]>(
            seedsListOptions.queryKey,
          ) ?? [];

        const updatedHistory = currentHistory.map((item) => {
          if (item.seed.id === updatedTransformation.seedId) {
            return {
              ...item,
              transformations: item.transformations.map((t) =>
                t.id === updatedTransformation.id ? updatedTransformation : t,
              ),
            };
          }
          return item;
        });

        queryClient.setQueryData(seedsListOptions.queryKey, updatedHistory);
        queryClient.invalidateQueries({
          queryKey: trpc.transformations.getStats.queryKey(),
        });

        setLatestGeneration((prev) => {
          if (!prev || prev.seed.id !== updatedTransformation.seedId)
            return prev;
          return {
            ...prev,
            transformations: prev.transformations.map((t) =>
              t.id === updatedTransformation.id ? updatedTransformation : t,
            ),
          };
        });
      },
    }),
  );

  const deleteSeedMutation = useMutation(
    trpc.seeds.delete.mutationOptions({
      onSuccess: (_, variables) => {
        const currentHistory =
          queryClient.getQueryData<SeedHistoryItem[]>(
            seedsListOptions.queryKey,
          ) ?? [];
        queryClient.setQueryData(
          seedsListOptions.queryKey,
          currentHistory.filter((item) => item.seed.id !== variables.id),
        );
        queryClient.invalidateQueries({
          queryKey: trpc.transformations.getStats.queryKey(),
        });
        if (latestGeneration?.seed.id === variables.id) {
          setLatestGeneration(null);
        }
      },
    }),
  );

  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const regenerateMutation = useMutation(
    trpc.transformations.regenerate.mutationOptions({
      onSuccess: (updatedTransformation) => {
        setRegeneratingId(null);

        const currentHistory =
          queryClient.getQueryData<SeedHistoryItem[]>(
            seedsListOptions.queryKey,
          ) ?? [];

        const updatedHistory = currentHistory.map((item) => {
          if (item.seed.id === updatedTransformation.seedId) {
            return {
              ...item,
              transformations: item.transformations.map((t) =>
                t.id === updatedTransformation.id ? updatedTransformation : t,
              ),
            };
          }
          return item;
        });

        queryClient.setQueryData(seedsListOptions.queryKey, updatedHistory);

        setLatestGeneration((prev) => {
          if (!prev || prev.seed.id !== updatedTransformation.seedId)
            return prev;
          return {
            ...prev,
            transformations: prev.transformations.map((t) =>
              t.id === updatedTransformation.id ? updatedTransformation : t,
            ),
          };
        });

        const platform = updatedTransformation.platform;
        const platformNames: Record<string, string> = {
          x: "X Thread",
          linkedin: "LinkedIn",
          tiktok: "TikTok Script",
          blog: "Blog Intro",
        };
        toast.dismiss(`regenerate-${updatedTransformation.id}`);
        toast.success(`${platformNames[platform]} regenerated!`);
      },
      onError: (_error, variables) => {
        setRegeneratingId(null);
        toast.dismiss(`regenerate-${variables.id}`);
        toast.error("Failed to regenerate content");
      },
    }),
  );

  const handleGenerate = (
    content: string,
    platforms: string[],
    options: TransformOptions,
  ) => {
    setLatestGeneration(null);
    generateMutation.mutate({
      content,
      platforms: platforms as ("x" | "linkedin" | "tiktok" | "blog")[],
      tone: options.tone,
      length: options.length,
      persona: options.persona || undefined,
    });
  };

  const handleMarkAsPosted = (id: string, posted: boolean) => {
    markAsPostedMutation.mutate({ id, posted });
  };

  const handleDeleteSeed = (id: string) => {
    deleteSeedMutation.mutate({ id });
  };

  const handleRegenerate = (id: string) => {
    setRegeneratingId(id);
    regenerateMutation.mutate({ id });
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 h-60 w-60 rounded-full bg-chart-2/20 blur-[100px]" />
      </div>

      <main className="relative z-20 mx-auto max-w-7xl px-6 py-8">
        {!view ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <StatsCards />
            <div className="grid gap-6 lg:grid-cols-2">
              <SeedInput
                onGenerate={handleGenerate}
                isGenerating={generateMutation.isPending}
              />
              <TransformOutput
                transformations={latestGeneration?.transformations ?? []}
                isGenerating={generateMutation.isPending}
                onMarkAsPosted={handleMarkAsPosted}
                onRegenerate={handleRegenerate}
                isRegenerating={regeneratingId}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <RecentSeeds
              history={seedHistory}
              onDeleteSeed={handleDeleteSeed}
            />
          </motion.div>
        )}
      </main>
    </div>
  );
}
