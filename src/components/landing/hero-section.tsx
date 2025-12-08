"use client";

import { Check, FileText, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";
import { cn } from "@/lib/utils";
import { Linkedin, Tiktok, X } from "../ui/svgs";

const platforms = [
  { name: "X Thread", Icon: X },
  { name: "LinkedIn", Icon: Linkedin },
  { name: "TikTok Script", Icon: Tiktok },
  { name: "Blog Intro", Icon: FileText },
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
            <Sparkles className="mr-1.5 size-3" />
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
          <span className="bg-linear-to-br from-primary via-[oklch(0.8_0.18_50)] to-primary bg-size-[200%_auto] animate-gradient motion-reduce:animate-none bg-clip-text text-transparent drop-shadow-[0_0_30px_oklch(0.72_0.19_30/50%)]">
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
          className="flex flex-col items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <WaitlistForm variant="hero" />
          <Link
            href="/try"
            className={cn(
              "w-full shadow-[0_0_40px_oklch(0.72_0.19_30/30%),0_0_80px_oklch(0.72_0.19_30/15%)] transition-all hover:shadow-[0_0_60px_oklch(0.72_0.19_30/40%),0_0_100px_oklch(0.72_0.19_30/20%)] sm:w-auto",
              buttonVariants({ size: "lg", variant: "outline" }),
            )}
          >
            <Sparkles className="mr-2 size-4" />
            Try It Free
          </Link>
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
            <div className="size-3 rounded-full bg-red-500/80" />
            <div className="size-3 rounded-full bg-yellow-500/80" />
            <div className="size-3 rounded-full bg-green-500/80" />
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
                  <platform.Icon className="size-4" />
                  <span className="flex-1 text-sm">{platform.name}</span>
                  <div className="flex size-6 items-center justify-center rounded bg-primary/10">
                    <Check className="size-3 text-primary" />
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
