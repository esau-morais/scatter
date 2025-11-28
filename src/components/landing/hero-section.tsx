"use client";

import {
  ArrowRight,
  Check,
  FileText,
  Linkedin,
  Sparkles,
  Twitter,
  Video,
} from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const platforms = [
  { name: "X Thread", icon: Twitter, color: "text-sky-400" },
  { name: "LinkedIn", icon: Linkedin, color: "text-blue-500" },
  { name: "TikTok Script", icon: Video, color: "text-pink-500" },
  { name: "Blog Intro", icon: FileText, color: "text-emerald-400" },
];

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16 z-10">
      {/* Window control buttons */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 h-60 w-60 rounded-full bg-chart-2/20 blur-[100px]" />
        <div className="absolute -bottom-20 left-1/3 h-60 w-60 rounded-full bg-chart-3/15 blur-[100px]" />
      </div>

      <div className="relative pt-11 z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Badge
            variant="secondary"
            className="mb-6 border-primary/30 bg-primary/10 text-primary"
          >
            <Sparkles className="mr-1.5 h-3 w-3" />
            Built for creators who hate busywork
          </Badge>
        </motion.div>

        <motion.h1
          className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl md:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Write once.
          <br />
          <span className="bg-linear-to-br from-primary via-[oklch(0.8_0.18_50)] to-primary bg-size-[200%_auto] animate-gradient bg-clip-text text-transparent drop-shadow-[0_0_30px_oklch(0.72_0.19_30/50%)]">
            Scatter everywhere.
          </span>
        </motion.h1>

        <motion.p
          className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Stop reformatting the same idea for every platform. Drop your core
          concept and get ready-to-post content for{" "}
          <span className="text-sky-400">X</span>,{" "}
          <span className="text-blue-500">LinkedIn</span>,{" "}
          <span className="text-pink-500">TikTok</span>, and your{" "}
          <span className="text-emerald-400">blog</span>—in seconds.
        </motion.p>

        <motion.div
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            size="lg"
            className="shadow-[0_0_40px_oklch(0.72_0.19_30/30%),0_0_80px_oklch(0.72_0.19_30/15%)] group px-8 text-base"
          >
            Get Early Access
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
          <Button size="lg" variant="outline" className="px-8 text-base">
            See How It Works
          </Button>
        </motion.div>

        <motion.div
          className="mt-16 flex items-center justify-center gap-8 text-sm text-muted-foreground sm:gap-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div>
            <span className="block text-2xl font-bold text-foreground">
              51%
            </span>
            creators report monthly burnout
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="block text-2xl font-bold text-foreground">
              4-5
            </span>
            platforms to manage
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="block text-2xl font-bold text-foreground">1</span>
            click to transform
          </div>
        </motion.div>
      </div>

      <motion.div
        className="relative z-10 mt-20 w-full max-w-5xl px-4"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="shadow-[0_0_40px_oklch(0.72_0.19_30/30%),0_0_80px_oklch(0.72_0.19_30/15%)] rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-4 text-sm text-muted-foreground">
              scatter.app
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-secondary/50 p-4">
              <div className="mb-3 text-sm font-medium text-muted-foreground">
                Your Core Idea
              </div>
              <div className="min-h-[120px] font-mono text-sm leading-relaxed text-foreground/90">
                <span className="text-primary">|</span> The best marketing
                doesn&apos;t feel like marketing. It feels like a friend sharing
                something valuable. Stop selling. Start helping.
              </div>
            </div>
            <div className="space-y-3">
              {platforms.map((platform, i) => (
                <motion.div
                  key={platform.name}
                  className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <platform.icon className={cn("size-4", platform.color)} />
                  <span className="flex-1 text-sm">{platform.name}</span>
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
