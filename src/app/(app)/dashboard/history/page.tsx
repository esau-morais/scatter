"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import { RecentSeeds } from "@/components/dashboard/recent-seeds";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useTRPC } from "@/lib/trpc/client";

export default function HistoryPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const seedsListOptions = trpc.seeds.list.queryOptions();
  const { data: seedHistory = [] } = useQuery(seedsListOptions);

  const deleteSeedMutation = useMutation(
    trpc.seeds.delete.mutationOptions({
      onSuccess: (_, variables) => {
        const currentHistory =
          queryClient.getQueryData<typeof seedHistory>(
            seedsListOptions.queryKey,
          ) ?? [];
        queryClient.setQueryData(
          seedsListOptions.queryKey,
          currentHistory.filter((item) => item.seed.id !== variables.id),
        );
        queryClient.invalidateQueries(
          trpc.transformations.getDashboardData.queryOptions(),
        );
      },
    }),
  );

  const handleDeleteSeed = (id: string) => {
    deleteSeedMutation.mutate({ id });
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 h-60 w-60 rounded-full bg-chart-2/20 blur-[100px]" />
      </div>

      <main className="relative z-20 mx-auto max-w-7xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>History</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <RecentSeeds history={seedHistory} onDeleteSeed={handleDeleteSeed} />
        </motion.div>
      </main>
    </div>
  );
}
