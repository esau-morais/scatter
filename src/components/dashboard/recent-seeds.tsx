"use client";

import {
  Clock,
  FileText,
  History,
  Linkedin,
  Sparkles,
  Twitter,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Seed, Transformation } from "@/db/schema";
import { cn } from "@/lib/utils";

const platformMeta = {
  x: { name: "X Thread", Icon: Twitter, color: "text-sky-400" },
  linkedin: { name: "LinkedIn", Icon: Linkedin, color: "text-blue-500" },
  tiktok: { name: "TikTok Script", Icon: Video, color: "text-pink-500" },
  blog: { name: "Blog Intro", Icon: FileText, color: "text-emerald-400" },
};

type SeedHistoryItem = {
  seed: Seed;
  transformations: Transformation[];
};

interface RecentSeedsProps {
  history: SeedHistoryItem[];
}

export function RecentSeeds({ history = [] }: RecentSeedsProps) {
  const showEmptyState = history.length === 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Transformation History</h2>
        <p className="text-sm text-muted-foreground">
          Your recent content transformations
        </p>
      </div>

      {showEmptyState ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex min-h-[500px] flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-card/30 p-12 text-center backdrop-blur-sm"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <History className="h-10 w-10 text-primary" />
          </div>
          <h3 className="mb-3 text-2xl font-bold">No Transformations Yet</h3>
          <p className="mb-8 max-w-md text-sm text-muted-foreground leading-relaxed">
            Your transformation history will appear here once you start creating
            content. Each seed idea will be saved with all its platform outputs
            for easy access later.
          </p>
          <Button
            size="lg"
            className="shadow-[0_0_40px_oklch(0.72_0.19_30/30%),0_0_80px_oklch(0.72_0.19_30/15%)]"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Create Your First Transformation
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {history.map(({ seed, transformations }, i) => (
            <motion.div
              key={seed.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="group cursor-pointer border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-card/80">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold group-hover:text-primary">
                      {seed.title}
                    </h3>
                    <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground md:mb-0">
                      <Clock className="h-3 w-3" />
                      {new Date(seed.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {transformations.map((t) => {
                      const platform = platformMeta[t.platform];
                      const isPosted = t.postedAt !== null;
                      return (
                        <Badge
                          key={t.id}
                          variant="outline"
                          className={cn(
                            "flex items-center gap-1.5 border-border bg-secondary/70 py-1 pl-1 pr-2",
                            isPosted &&
                              "border-emerald-500/50 text-emerald-500",
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-5 w-5 items-center justify-center rounded-sm bg-background",
                              platform.color,
                            )}
                          >
                            <platform.Icon className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-medium">
                            {platform.name}
                          </span>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
