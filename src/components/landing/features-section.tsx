"use client";

import { Copy, MessageSquare, Sparkles, Zap } from "lucide-react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "One Input, Four Outputs",
    description:
      "Drop your idea once. Get platform-optimized content for X, LinkedIn, TikTok, and your blog instantly.",
    icon: Zap,
  },
  {
    title: "Platform-Native Tone",
    description:
      "Each output matches platform culture—punchy for X, professional for LinkedIn, casual for TikTok.",
    icon: MessageSquare,
  },
  {
    title: "Copy & Go",
    description:
      "One-click copy to clipboard. No API approvals, no scheduling headaches. Just create and post.",
    icon: Copy,
  },
  {
    title: "AI-Powered Transformation",
    description:
      "Advanced AI that understands hooks, CTAs, and formatting rules for each platform.",
    icon: Sparkles,
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

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="group relative h-full overflow-hidden border-border/50 bg-card/50 p-6 backdrop-blur-sm transition-colors hover:border-primary/30 hover:bg-card/80">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
