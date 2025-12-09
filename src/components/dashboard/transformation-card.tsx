"use client";

import { Check, Copy, Expand, RefreshCw, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  PlatformBadge,
  type PlatformType,
  platformConfig,
} from "@/components/ui/platform-badge";
import type { Transformation } from "@/db/schema";
import { cn } from "@/lib/utils";
import {
  getCharacterCount,
  getCharLimitStatus,
} from "./transform-output-utils";

interface TransformationCardProps {
  transformation: Transformation;
  index: number;
  copiedId: string | null;
  isRegenerating: string | null;
  onCopy: (id: string, content: string, platformName: string) => void;
  onExpand: (transformation: Transformation) => void;
  onMarkAsPosted: (id: string, posted: boolean, platformName: string) => void;
  onRegenerate?: (id: string, platformName: string) => void;
}

export function TransformationCard({
  transformation,
  index,
  copiedId,
  isRegenerating,
  onCopy,
  onExpand,
  onMarkAsPosted,
  onRegenerate,
}: TransformationCardProps) {
  const platform = transformation.platform as PlatformType;
  const config = platformConfig[platform];
  const isPosted = transformation.postedAt !== null;
  const charCount = getCharacterCount(transformation.content);
  const { isOverLimit, isNearLimit } = getCharLimitStatus(
    charCount,
    config.maxChars,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
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
                {transformation.editedAt && (
                  <Badge
                    variant="outline"
                    className="text-xs border-primary/50 text-primary"
                  >
                    Edited
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
                className="size-8 transition-all hover:bg-primary/10"
                onClick={() => onRegenerate(transformation.id, config.name)}
                disabled={isRegenerating === transformation.id}
              >
                <RefreshCw
                  className={cn(
                    "size-4",
                    isRegenerating === transformation.id &&
                      "animate-spin motion-reduce:animate-none",
                  )}
                />
              </Button>
            )}
            <Button
              size="icon-sm"
              variant="ghost"
              className="size-8 transition-all hover:bg-secondary"
              onClick={() => onExpand(transformation)}
            >
              <Expand className="size-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className={cn(
                "size-8 transition-all",
                isPosted && "bg-success/10",
              )}
              onClick={() =>
                onMarkAsPosted(transformation.id, !isPosted, config.name)
              }
            >
              <Send
                className={cn(
                  "size-4 transition-colors",
                  isPosted && "text-success",
                )}
              />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              className="size-8 transition-all hover:bg-primary/10"
              onClick={() =>
                onCopy(transformation.id, transformation.content, config.name)
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
}
