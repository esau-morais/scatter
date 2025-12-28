"use client";

import { Copy, MessageSquare, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";

const features = [
  {
    name: "One Input, Four Outputs",
    description:
      "Drop your idea once. Get platform-optimized content for X, LinkedIn, TikTok, and your blog instantly.",
    Icon: Zap,
    className: "col-span-3 lg:col-span-2",
    colorVariation: "var(--primary)",
    cta: "Learn more",
  },
  {
    name: "Platform-Native Tone",
    description:
      "Each output matches platform culture—punchy for X, professional for LinkedIn, casual for TikTok.",
    Icon: MessageSquare,
    className: "col-span-3 lg:col-span-1",
    colorVariation: "var(--chart-2)",
    cta: "Learn more",
  },
  {
    name: "Copy & Go",
    description:
      "One-click copy to clipboard. No API approvals, no scheduling headaches. Just create and post.",
    Icon: Copy,
    className: "col-span-3 lg:col-span-1",
    colorVariation: "var(--chart-3)",
    cta: "Learn more",
  },
  {
    name: "AI-Powered Transformation",
    description:
      "Advanced AI that understands hooks, CTAs, and formatting rules for each platform.",
    Icon: Sparkles,
    className: "col-span-3 lg:col-span-2",
    colorVariation: "var(--primary)",
    cta: "Learn more",
  },
];

export function FeaturesSection() {
  return (
    <section className="relative py-24 z-10">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="secondary" className="mb-6">
            Features
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            A repurposing engine,
            <br />
            not another writing tool.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <BentoGrid className="lg:grid-cols-3">
            {features.map((feature) => (
              <BentoCard key={feature.name} {...feature} />
            ))}
          </BentoGrid>
        </motion.div>
      </div>
    </section>
  );
}
