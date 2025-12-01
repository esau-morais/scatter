"use client";

import { FileText, Linkedin, Sparkles, Twitter, Video } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const availablePlatforms = [
  { id: "x", name: "X Thread", icon: Twitter, color: "text-sky-400" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-500" },
  { id: "tiktok", name: "TikTok Script", icon: Video, color: "text-pink-500" },
  { id: "blog", name: "Blog Intro", icon: FileText, color: "text-emerald-400" },
];

interface SeedInputProps {
  onGenerate?: (content: string, platforms: string[]) => void;
  isGenerating?: boolean;
}

export function SeedInput({ onGenerate, isGenerating }: SeedInputProps) {
  const [seed, setSeed] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    availablePlatforms.map((p) => p.id),
  );

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId],
    );
  };

  const handleTransform = () => {
    if (onGenerate) {
      onGenerate(seed, selectedPlatforms);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 p-6 backdrop-blur-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Core Idea</h2>
        <span className="text-xs text-muted-foreground">
          {seed.length} characters
        </span>
      </div>
      <Textarea
        placeholder="Drop your idea here... It can be a concept, voice note transcript, or rough draft. We'll transform it into platform-optimized content."
        value={seed}
        onChange={(e) => setSeed(e.target.value)}
        className="mb-4 min-h-60 resize-none border-border bg-secondary/50 font-mono text-sm leading-relaxed"
      />

      <div className="mb-4">
        <p className="mb-2 block text-xs font-medium text-muted-foreground">
          Transform to:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {availablePlatforms.map((platform) => {
            const isSelected = selectedPlatforms.includes(platform.id);
            return (
              <button
                key={platform.id}
                type="button"
                onClick={() => togglePlatform(platform.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                  isSelected
                    ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_oklch(0.72_0.19_30/15%)]"
                    : "border-border bg-secondary/30 hover:border-border hover:bg-secondary/50",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-md transition-all",
                    isSelected ? "bg-primary/20" : "bg-background",
                  )}
                >
                  <platform.icon
                    className={cn(
                      "h-3.5 w-3.5",
                      isSelected ? platform.color : "text-muted-foreground",
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "font-medium",
                    isSelected ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {platform.name}
                </span>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Button
        className="w-full shadow-[0_0_40px_oklch(0.72_0.19_30/30%),0_0_80px_oklch(0.72_0.19_30/15%)]"
        onClick={handleTransform}
        disabled={!seed || isGenerating || selectedPlatforms.length === 0}
      >
        {isGenerating ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
              }}
            >
              <Sparkles className="mr-2 h-4 w-4" />
            </motion.div>
            Transforming...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Transform to {selectedPlatforms.length}{" "}
            {selectedPlatforms.length === 1 ? "Platform" : "Platforms"}
          </>
        )}
      </Button>
    </Card>
  );
}
