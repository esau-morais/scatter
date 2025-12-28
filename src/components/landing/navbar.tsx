"use client";

import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Scatter } from "../ui/svgs";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Scatter className="size-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Scatter</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link
            href="/try"
            className={cn(
              "shadow-[0_0_40px_oklch(0.72_0.19_30/30%),0_0_80px_oklch(0.72_0.19_30/15%)] transition-all hover:shadow-[0_0_60px_oklch(0.72_0.19_30/40%),0_0_100px_oklch(0.72_0.19_30/20%)]",
              buttonVariants({ size: "sm", variant: "default" }),
            )}
          >
            <Sparkles className="mr-2 size-4" />
            Try It Free
          </Link>
        </motion.div>
      </div>
    </nav>
  );
}
