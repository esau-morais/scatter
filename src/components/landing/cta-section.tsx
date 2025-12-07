"use client";

import { motion } from "motion/react";
import { WaitlistForm } from "@/components/waitlist/waitlist-form";

export function CTASection() {
  return (
    <section className="relative py-32 z-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center"
        >
          <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Ready to stop the
            <br />
            <span className="bg-linear-to-br from-primary via-[oklch(0.8_0.18_50)] to-primary bg-size-[200%_auto] motion-safe:animate-gradient bg-clip-text text-transparent">
              content treadmill?
            </span>
          </h2>
          <p className="mb-10 text-lg text-muted-foreground">
            Join creators who are reclaiming their time and energy. Write once,
            scatter everywhere.
          </p>
          <WaitlistForm variant="cta" />
        </motion.div>
      </div>
    </section>
  );
}
