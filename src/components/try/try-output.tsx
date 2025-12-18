"use client";

import {
  Check,
  X as Close,
  Copy,
  Expand,
  FileText,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PlatformBadge,
  type PlatformType,
  platformConfig,
} from "@/components/ui/platform-badge";
import { Linkedin, Tiktok, X } from "@/components/ui/svgs";
import type { GuestTransformation } from "@/lib/schemas/demo";
import { cn } from "@/lib/utils";

interface TryOutputProps {
  transformations: GuestTransformation[];
  isGenerating: boolean;
}

export function TryOutput({ transformations, isGenerating }: TryOutputProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTransformation, setExpandedTransformation] =
    useState<GuestTransformation | null>(null);

  const handleCopy = (id: string, content: string, platformName: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success(`${platformName} content copied!`, {
      description: "Ready to paste and post",
      duration: 2000,
    });
    setTimeout(() => setCopiedId(null), 2000);
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
          <Sparkles className="size-8 text-primary" />
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
              className="size-2 rounded-full bg-primary"
            />
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: 0.2,
              }}
              className="size-2 rounded-full bg-primary"
            />
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.5,
                repeat: Number.POSITIVE_INFINITY,
                delay: 0.4,
              }}
              className="size-2 rounded-full bg-primary"
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
            : "Your generated content will appear here"}
        </p>
      </div>

      {!hasContent ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-linear-to-br from-secondary/50 via-secondary/40 to-background/50 p-8 text-center">
          <motion.div
            animate={{
              y: [0, -10, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="relative mb-6"
          >
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-primary/30 to-primary/10 ring-4 ring-primary/10">
              <Sparkles className="size-10 text-primary" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="mb-3 text-xl font-bold">Ready to Transform</h3>
            <p className="mb-6 max-w-md text-sm text-muted-foreground leading-relaxed">
              We've pre-filled an example idea for you. Hit{" "}
              <span className="font-semibold text-foreground">Generate</span> to
              see the magic happen!
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
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {transformations.map((transformation, i) => {
              const platform = transformation.platform as PlatformType;
              const config = platformConfig[platform];
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
                  <Card className="group relative overflow-hidden border-border bg-secondary/50 p-4 transition-all hover:border-border hover:bg-secondary/70">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-1 items-start gap-3">
                        <PlatformBadge platform={platform} />
                        <div className="flex-1 min-w-0">
                          <div className="mb-2 flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{config.name}</p>
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
                          <p className="line-clamp-2 text-xs text-muted-foreground whitespace-pre-wrap wrap-break-word">
                            {transformation.content}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="size-8 transition-all hover:bg-secondary"
                          onClick={() =>
                            setExpandedTransformation(transformation)
                          }
                        >
                          <Expand className="size-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="size-8 transition-all hover:bg-primary/10"
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
                                <Check className="size-4 text-success" />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="copy"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Copy className="size-4" />
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
                        <Close className="size-4" />
                      </Button>
                    </div>

                    <div className="overflow-auto max-h-[60vh] p-6">
                      <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {expandedTransformation.content}
                      </pre>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-border p-4">
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
                        <Copy className="mr-2 size-4" />
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
