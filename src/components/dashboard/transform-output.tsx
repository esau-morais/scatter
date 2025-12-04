"use client";

import {
  Check,
  Copy,
  Expand,
  RefreshCw,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PlatformBadge,
  type PlatformType,
  platformConfig,
} from "@/components/ui/platform-badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Transformation } from "@/db/schema";
import { cn } from "@/lib/utils";

interface TransformOutputProps {
  transformations: Transformation[];
  isGenerating: boolean;
  onMarkAsPosted: (id: string, posted: boolean) => void;
  onRegenerate?: (id: string) => void;
  isRegenerating?: string | null;
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
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function TransformOutput({
  transformations,
  isGenerating,
  onMarkAsPosted,
  onRegenerate,
  isRegenerating,
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
    if (onRegenerate) {
      onRegenerate(id);
      toast.loading(`Regenerating ${platformName} content...`, {
        id: `regenerate-${id}`,
      });
    }
  };

  const getCharacterCount = (content: string) => content.length;

  const hasContent = transformations.length > 0;

  if (isGenerating && !hasContent) {
    return (
      <Card className="flex min-h-[400px] flex-col items-center justify-center border-border/50 bg-card/50 p-6 text-center backdrop-blur-sm">
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: {
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            },
            scale: {
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            },
          }}
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/5"
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="mb-2 text-lg font-semibold">
            Crafting your content...
          </h3>
          <p className="mb-4 max-w-sm text-sm text-muted-foreground">
            Our AI is generating platform-optimized content. This usually takes
            15-20 seconds.
          </p>
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: 0,
              }}
              className="h-2 w-2 rounded-full bg-primary"
            />
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: 0.2,
              }}
              className="h-2 w-2 rounded-full bg-primary"
            />
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: 0.4,
              }}
              className="h-2 w-2 rounded-full bg-primary"
            />
          </div>
        </motion.div>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 p-6 backdrop-blur-sm">
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
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border/50 bg-secondary/30 p-8 text-center">
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-primary/20 to-primary/5"
          >
            <Sparkles className="h-8 w-8 text-primary" />
          </motion.div>
          <h3 className="mb-2 text-lg font-semibold">Ready to Transform</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed">
            Enter your core idea and select which platforms you want. We'll
            instantly generate optimized content for each one.
          </p>
        </div>
      ) : isGenerating ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {transformations.map((transformation, i) => {
              const platform = transformation.platform as PlatformType;
              const config = platformConfig[platform];
              const isPosted = transformation.postedAt !== null;
              const charCount = getCharacterCount(transformation.content);
              const isNearLimit = charCount > config.maxChars * 0.9;
              const isOverLimit = charCount > config.maxChars;

              return (
                <motion.div
                  key={transformation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.08, duration: 0.3 }}
                >
                  <Card
                    className={cn(
                      "group relative overflow-hidden border-border bg-secondary/50 p-4 transition-all hover:border-border hover:bg-secondary/70",
                      isPosted && "bg-secondary/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-1 items-start gap-3">
                        <PlatformBadge platform={platform} />
                        <div className="flex-1 min-w-0">
                          <div className="mb-2 flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{config.name}</p>
                            {isPosted && (
                              <Badge
                                variant="outline"
                                className="border-success/50 text-success text-xs"
                              >
                                Posted
                              </Badge>
                            )}
                            <span
                              className={cn(
                                "ml-auto text-xs tabular-nums",
                                isOverLimit
                                  ? "text-destructive font-medium"
                                  : isNearLimit
                                    ? "text-warning font-medium"
                                    : "text-muted-foreground",
                              )}
                            >
                              {charCount}/{config.maxChars}
                            </span>
                          </div>
                          <p
                            className={cn(
                              "line-clamp-2 text-xs text-muted-foreground whitespace-pre-wrap wrap-break-word",
                              isPosted && "opacity-70",
                            )}
                          >
                            {transformation.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {onRegenerate && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="h-8 w-8 transition-all hover:bg-primary/10"
                            onClick={() =>
                              handleRegenerate(transformation.id, config.name)
                            }
                            disabled={isRegenerating === transformation.id}
                          >
                            <RefreshCw
                              className={cn(
                                "h-4 w-4",
                                isRegenerating === transformation.id &&
                                  "animate-spin",
                              )}
                            />
                          </Button>
                        )}
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="h-8 w-8 transition-all hover:bg-secondary"
                          onClick={() =>
                            setExpandedTransformation(transformation)
                          }
                        >
                          <Expand className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className={cn(
                            "h-8 w-8 transition-all",
                            isPosted && "bg-success/10",
                          )}
                          onClick={() =>
                            handleMarkAsPosted(
                              transformation.id,
                              !isPosted,
                              config.name,
                            )
                          }
                        >
                          <Send
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isPosted && "text-success",
                            )}
                          />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="h-8 w-8 transition-all hover:bg-primary/10"
                          onClick={() =>
                            handleCopy(
                              transformation.id,
                              transformation.content,
                              config.name,
                            )
                          }
                        >
                          <AnimatePresence mode="wait">
                            {copiedId === transformation.id ? (
                              <motion.div
                                key="check"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Check className="h-4 w-4 text-success" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="copy"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Copy className="h-4 w-4" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {expandedTransformation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={() => setExpandedTransformation(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const platform =
                  expandedTransformation.platform as PlatformType;
                const config = platformConfig[platform];
                const charCount = getCharacterCount(
                  expandedTransformation.content,
                );
                const isOverLimit = charCount > config.maxChars;
                const isNearLimit = charCount > config.maxChars * 0.9;

                return (
                  <>
                    <div className="flex items-center justify-between border-b border-border p-4">
                      <div className="flex items-center gap-3">
                        <PlatformBadge platform={platform} />
                        <div>
                          <h3 className="font-semibold">{config.name}</h3>
                          <span
                            className={cn(
                              "text-xs tabular-nums",
                              isOverLimit
                                ? "text-destructive font-medium"
                                : isNearLimit
                                  ? "text-warning font-medium"
                                  : "text-muted-foreground",
                            )}
                          >
                            {charCount}/{config.maxChars} characters
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setExpandedTransformation(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="overflow-auto max-h-[60vh] p-6">
                      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {expandedTransformation.content}
                      </pre>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border p-4">
                      {onRegenerate && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleRegenerate(
                              expandedTransformation.id,
                              config.name,
                            );
                            setExpandedTransformation(null);
                          }}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Regenerate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => {
                          handleCopy(
                            expandedTransformation.id,
                            expandedTransformation.content,
                            config.name,
                          );
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Content
                      </Button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
