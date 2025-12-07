"use client";

import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

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
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Scatter</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button
            size="sm"
            className="shadow-[0_0_40px_oklch(0.72_0.19_30/30%),0_0_80px_oklch(0.72_0.19_30/15%)]"
          >
            Join Waitlist
          </Button>
        </motion.div>
      </div>
    </nav>
  );
}
