"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";

export function HowItWorksSection() {
  return (
    <section className="relative py-24 z-10">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="secondary" className="mb-6">
            How It Works
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Three steps to everywhere
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute left-8 top-8 hidden h-[calc(100%-4rem)] w-px bg-linear-to-b from-primary via-primary/50 to-transparent md:block" />

          {[
            {
              step: "01",
              title: "Drop your idea",
              description:
                "Paste your core concept, voice note transcript, or rough draft into the editor.",
            },
            {
              step: "02",
              title: "Hit transform",
              description:
                "Watch as AI generates platform-optimized versions for X, LinkedIn, TikTok, and your blog.",
            },
            {
              step: "03",
              title: "Copy and post",
              description:
                "One click to copy. Tab over to each platform and share. Done in minutes, not hours.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              className="relative mb-12 flex items-start gap-6 last:mb-0"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary font-mono text-xl font-bold text-primary-foreground">
                {item.step}
              </div>
              <div className="pt-3">
                <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
