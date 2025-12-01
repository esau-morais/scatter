"use client";

import {
  Check,
  Copy,
  FileText,
  Linkedin,
  Send,
  Sparkles,
  Twitter,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Transformation } from "@/db/schema";
import { cn } from "@/lib/utils";

const platformMeta = {
  x: { name: "X Thread", Icon: Twitter, color: "text-sky-400" },
  linkedin: { name: "LinkedIn", Icon: Linkedin, color: "text-blue-500" },
  tiktok: { name: "TikTok Script", Icon: Video, color: "text-pink-500" },
  blog: { name: "Blog Intro", Icon: FileText, color: "text-emerald-400" },
};

interface TransformOutputProps {
  transformations: Transformation[];
  isGenerating: boolean;
  onMarkAsPosted: (id: string, posted: boolean) => void;
}

export function TransformOutput({
  transformations,
  isGenerating,
  onMarkAsPosted,
}: TransformOutputProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const hasContent = transformations.length > 0;

  if (isGenerating && !hasContent) {
    return (
      <Card className="flex min-h-[400px] flex-col items-center justify-center border-border/50 bg-card/50 p-6 text-center backdrop-blur-sm">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
        <h3 className="mb-2 text-lg font-semibold">Generating...</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Hold tight, our AI is crafting your content. This usually takes about
          20 seconds.
        </p>
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
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Ready to Transform</h3>
          <p className="mb-6 max-w-sm text-sm text-muted-foreground leading-relaxed">
            Enter your core idea and select which platforms you want. We'll
            instantly generate optimized content for each one.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transformations.map((transformation, i) => {
            const platform = platformMeta[transformation.platform];
            const isPosted = transformation.postedAt !== null;

            return (
              <motion.div
                key={transformation.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card
                  className={cn(
                    "group border-border bg-secondary/50 p-4 transition-all",
                    isPosted && "bg-secondary/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-1 items-start gap-3">
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background",
                          platform.color,
                        )}
                      >
                        <platform.Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <p className="text-sm font-medium">{platform.name}</p>
                          {isPosted && (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/50 text-emerald-500"
                            >
                              Posted
                            </Badge>
                          )}
                        </div>
                        <p
                          className={cn(
                            "line-clamp-2 text-xs text-muted-foreground",
                            isPosted && "opacity-70",
                          )}
                        >
                          {transformation.content}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() =>
                          onMarkAsPosted(transformation.id, !isPosted)
                        }
                      >
                        <Send
                          className={cn(
                            "h-4 w-4",
                            isPosted && "text-emerald-500",
                          )}
                        />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0"
                        onClick={() =>
                          handleCopy(transformation.id, transformation.content)
                        }
                      >
                        {copiedId === transformation.id ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
