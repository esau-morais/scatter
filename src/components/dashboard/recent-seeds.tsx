"use client";

import {
  CheckCircle,
  Clock,
  Filter,
  History,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PlatformBadge,
  type PlatformType,
  platformConfig,
} from "@/components/ui/platform-badge";
import type { Seed, Transformation } from "@/db/schema";
import { cn } from "@/lib/utils";

type SeedHistoryItem = {
  seed: Seed;
  transformations: Transformation[];
};

type FilterStatus = "all" | "posted" | "not_posted";
type FilterPlatform = PlatformType | "all";

interface RecentSeedsProps {
  history: SeedHistoryItem[];
  onDeleteSeed?: (id: string) => void;
}

export function RecentSeeds({ history = [], onDeleteSeed }: RecentSeedsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [platformFilter, setPlatformFilter] = useState<FilterPlatform>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Search filter - check seed content and title
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.seed.title?.toLowerCase().includes(query);
        const matchesContent = item.seed.content.toLowerCase().includes(query);
        const matchesTransformation = item.transformations.some((t) =>
          t.content.toLowerCase().includes(query),
        );
        if (!matchesTitle && !matchesContent && !matchesTransformation) {
          return false;
        }
      }

      // Platform filter
      if (platformFilter !== "all") {
        const hasPlatform = item.transformations.some(
          (t) => t.platform === platformFilter,
        );
        if (!hasPlatform) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const hasPosted = item.transformations.some((t) => t.postedAt !== null);
        const allPosted = item.transformations.every(
          (t) => t.postedAt !== null,
        );
        if (statusFilter === "posted" && !hasPosted) return false;
        if (statusFilter === "not_posted" && allPosted) return false;
      }

      return true;
    });
  }, [history, searchQuery, statusFilter, platformFilter]);

  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || platformFilter !== "all";
  const showEmptyState = history.length === 0;
  const showNoResults = !showEmptyState && filteredHistory.length === 0;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPlatformFilter("all");
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Transformation History</h2>
          <p className="text-sm text-muted-foreground">
            {showEmptyState
              ? "Your recent content transformations"
              : `${filteredHistory.length} of ${history.length} transformations`}
          </p>
        </div>
      </div>

      {!showEmptyState && (
        <div className="mb-6 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transformations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 bg-secondary/50 pl-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="default"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "gap-2 h-10 border transition-all",
                hasActiveFilters && "border-primary/50 text-primary",
              )}
            >
              <Filter className="size-4" />
              Filters
              {hasActiveFilters && (
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {
                    [
                      !!searchQuery,
                      statusFilter !== "all",
                      platformFilter !== "all",
                    ].filter(Boolean).length
                  }
                </span>
              )}
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-secondary/30 p-4">
                  <div className="space-y-2">
                    <span className="block text-xs font-medium text-muted-foreground">
                      Platform
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPlatformFilter("all")}
                        className={cn(
                          "rounded-md border px-2.5 py-1.5 text-xs transition-all",
                          platformFilter === "all"
                            ? "border-primary/50 bg-primary/10 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-secondary/50",
                        )}
                      >
                        All
                      </button>
                      {(Object.keys(platformConfig) as PlatformType[]).map(
                        (platform) => (
                          <button
                            key={platform}
                            type="button"
                            onClick={() => setPlatformFilter(platform)}
                            className={cn(
                              "rounded-md border px-2.5 py-1.5 text-xs transition-all",
                              platformFilter === platform
                                ? "border-primary/50 bg-primary/10 text-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-secondary/50",
                            )}
                          >
                            {platformConfig[platform].name}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-medium text-muted-foreground">
                      Status
                    </span>
                    <div className="flex gap-1.5">
                      {[
                        { id: "all", label: "All" },
                        { id: "posted", label: "Posted" },
                        { id: "not_posted", label: "Not Posted" },
                      ].map((status) => (
                        <button
                          key={status.id}
                          type="button"
                          onClick={() =>
                            setStatusFilter(status.id as FilterStatus)
                          }
                          className={cn(
                            "rounded-md border px-2.5 py-1.5 text-xs transition-all",
                            statusFilter === status.id
                              ? "border-primary/50 bg-primary/10 text-foreground"
                              : "border-border bg-background text-muted-foreground hover:bg-secondary/50",
                          )}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {hasActiveFilters && (
                    <div className="flex items-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {showEmptyState ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex min-h-[500px] flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-linear-to-br from-card/30 via-card/20 to-background/50 p-12 text-center backdrop-blur-sm"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-2xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/5 ring-4 ring-primary/10">
              <History className="size-12 text-primary" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="mb-3 text-2xl font-bold">No Transformations Yet</h3>
            <p className="mb-6 max-w-md text-sm text-muted-foreground leading-relaxed">
              Your transformation history will appear here once you start
              creating content. Each seed idea will be saved with all its
              platform outputs for easy access later.
            </p>
            <div className="mb-8 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle className="size-3.5" />
                </div>
                <span>View all seeds</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Search className="size-3.5" />
                </div>
                <span>Search content</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Filter className="size-3.5" />
                </div>
                <span>Filter by platform</span>
              </div>
            </div>
          </motion.div>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="shadow-[0_0_40px_oklch(0.72_0.19_30/30%),0_0_80px_oklch(0.72_0.19_30/15%)] transition-all hover:shadow-[0_0_60px_oklch(0.72_0.19_30/40%),0_0_100px_oklch(0.72_0.19_30/20%)]"
            >
              <Sparkles className="mr-2 size-4" />
              Create Your First Transformation
            </Button>
          </Link>
        </motion.div>
      ) : showNoResults ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-card/30 p-12 text-center backdrop-blur-sm"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">No matches found</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">
            Try adjusting your search or filters to find what you're looking
            for.
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredHistory.map(({ seed, transformations }, i) => {
              const postedCount = transformations.filter(
                (t) => t.postedAt !== null,
              ).length;
              const totalCount = transformations.length;

              return (
                <motion.div
                  key={seed.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                  layout
                >
                  <Card className="group border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-border hover:bg-card/70">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                            {seed.title || "Untitled"}
                          </h3>
                          {onDeleteSeed && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteSeed(seed.id);
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                          {seed.content}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-3" />
                            {new Date(seed.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year:
                                  new Date(seed.createdAt).getFullYear() !==
                                  new Date().getFullYear()
                                    ? "numeric"
                                    : undefined,
                              },
                            )}
                          </div>
                          {postedCount > 0 && (
                            <div className="flex items-center gap-1.5 text-success">
                              <CheckCircle className="size-3" />
                              {postedCount}/{totalCount} posted
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {transformations.map((t) => {
                          const platform = t.platform as PlatformType;
                          const isPosted = t.postedAt !== null;
                          return (
                            <div key={t.id} className="relative">
                              <PlatformBadge
                                platform={platform}
                                size="sm"
                                className={cn(
                                  isPosted && "ring-2 ring-success/30",
                                )}
                              />
                              {isPosted && (
                                <div className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-success">
                                  <CheckCircle className="h-2.5 w-2.5 text-white" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
