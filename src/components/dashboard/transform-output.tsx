"use client";

import { FileText, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transformation } from "@/db/schema";
import { Linkedin, Tiktok } from "../ui/svgs";
import { X } from "../ui/svgs/x";
import { ExpandedTransformationModal } from "./expanded-transformation-modal";
import { TransformationCard } from "./transformation-card";

interface TransformOutputProps {
  transformations: Transformation[];
  isGenerating: boolean;
  isPublishing: string | null;
  connectedAccounts?: {
    twitter: boolean;
    linkedin: boolean;
  };
  onMarkAsPosted: (id: string, posted: boolean) => void;
  onPublishToX?: (id: string) => void;
  onPublishToLinkedIn?: (id: string) => void;
  onRegenerate: (id: string) => void;
  isRegenerating: string | null;
  onUpdateContent: (id: string, content: string) => Promise<void>;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <Card
          key={i}
          className="border-border bg-secondary/50 p-4 backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-linear-to-br from-secondary/50 via-secondary/40 to-background/50 p-8 text-center">
      <div className="relative mb-6 motion-safe:animate-bounce">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary/30 to-primary/10 ring-4 ring-primary/10">
          <Sparkles className="size-10 text-primary" />
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="mb-3 text-xl font-bold">
          Your Content Will Appear Here
        </h3>
        <p className="mb-6 max-w-md text-sm text-muted-foreground leading-relaxed">
          Write your core idea on the left, select platforms, and click{" "}
          <span className="font-semibold text-foreground">Transform</span>.
          We'll generate optimized content for each platform in seconds.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1.5">
            <X className="size-3.5" />
            <span>X Threads</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1.5">
            <Linkedin className="size-3.5" />
            <span>LinkedIn Posts</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1.5">
            <Tiktok className="size-3.5" />
            <span>TikTok Scripts</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1.5">
            <FileText className="size-3.5 text-black dark:text-white" />
            <span>Blog Intros</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function GeneratingState() {
  return (
    <Card className="flex min-h-[400px] flex-col items-center justify-center border-border/50 bg-card/50 p-6 text-center backdrop-blur-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/5 motion-safe:animate-spin">
        <Sparkles className="size-8 text-primary" />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="mb-2 text-lg font-semibold">Crafting your content...</h3>
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">
          Our AI is generating platform-optimized content. This usually takes
          15-20 seconds.
        </p>
        <div className="flex items-center justify-center gap-2">
          <div className="size-2 rounded-full bg-primary motion-safe:animate-pulse" />
          <div className="size-2 rounded-full bg-primary motion-safe:animate-pulse motion-safe:delay-200" />
          <div className="size-2 rounded-full bg-primary motion-safe:animate-pulse motion-safe:delay-400" />
        </div>
      </motion.div>
    </Card>
  );
}

export function TransformOutput({
  transformations,
  isGenerating,
  isPublishing,
  connectedAccounts,
  onMarkAsPosted,
  onPublishToX,
  onPublishToLinkedIn,
  onRegenerate,
  isRegenerating,
  onUpdateContent,
}: TransformOutputProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTransformation, setExpandedTransformation] =
    useState<Transformation | null>(null);

  const handleCopy = (id: string, content: string, platformName: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success(`${platformName} content copied!`, {
      description: "Ready to paste and post",
      duration: 2000,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleMarkAsPosted = (
    id: string,
    posted: boolean,
    platformName: string,
  ) => {
    onMarkAsPosted(id, posted);
    if (posted) {
      toast.success(`Marked ${platformName} as posted!`, {
        description: "Keep up the great work 🎉",
      });
    }
  };

  const handleRegenerate = (id: string, platformName: string) => {
    onRegenerate(id);
    toast.loading(`Regenerating ${platformName} content...`, {
      id: `regenerate-${id}`,
    });
  };

  const handleExpand = (transformation: Transformation) => {
    setExpandedTransformation(transformation);
  };

  const handleUpdateTransformation = (updated: Transformation) => {
    setExpandedTransformation(updated);
  };

  const hasContent = transformations.length > 0;

  if (isGenerating && !hasContent) {
    return <GeneratingState />;
  }

  return (
    <Card className="border-border/80 bg-card/60 p-6 backdrop-blur-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Platform Outputs</h2>
        <p className="text-xs text-muted-foreground">
          {hasContent
            ? `Generated for ${transformations.length} ${
                transformations.length === 1 ? "platform" : "platforms"
              }`
            : "Select platforms and transform your content"}
        </p>
      </div>

      {!hasContent ? (
        <EmptyState />
      ) : isGenerating ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {transformations.map((transformation, i) => (
              <TransformationCard
                key={transformation.id}
                transformation={transformation}
                index={i}
                copiedId={copiedId}
                isRegenerating={isRegenerating ?? null}
                isPublishing={isPublishing ?? null}
                connectedAccounts={connectedAccounts}
                onCopy={handleCopy}
                onExpand={handleExpand}
                onMarkAsPosted={handleMarkAsPosted}
                onPublishToX={onPublishToX}
                onPublishToLinkedIn={onPublishToLinkedIn}
                onRegenerate={handleRegenerate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {expandedTransformation && (
          <ExpandedTransformationModal
            transformation={expandedTransformation}
            onClose={() => setExpandedTransformation(null)}
            onRegenerate={onRegenerate}
            onUpdateContent={onUpdateContent}
            onUpdateTransformation={handleUpdateTransformation}
          />
        )}
      </AnimatePresence>
    </Card>
  );
}
