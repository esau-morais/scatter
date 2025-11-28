"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";

export function ProblemSection() {
  return (
    <section className="relative py-32 z-10">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="secondary" className="mb-6">
            The Problem
          </Badge>
          <h2 className="mb-6 text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            You&apos;re not a content factory.
            <br />
            <span className="text-muted-foreground">
              But algorithms expect you to be.
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Managing 4-5 platforms. Different tones, formats, character limits.
            The same idea, reformatted 10 times. By the time you&apos;re done,
            you&apos;re too exhausted to create the next one.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
