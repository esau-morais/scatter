"use client";

import { Lightbulb, X } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OnboardingBannerProps {
  remaining?: number | null;
  onDismiss: () => void;
}

export function OnboardingBanner({
  remaining,
  onDismiss,
}: OnboardingBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-primary/30 bg-primary/5 p-4 backdrop-blur-sm mb-8">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Lightbulb className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Welcome to Scatter!</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>
                •{" "}
                <span className="text-foreground font-medium">
                  Paste your idea
                </span>{" "}
                → Select platforms → Generate
              </li>
              <li>
                • Mark content as{" "}
                <span className="text-foreground font-medium">"posted"</span> to
                track your success
              </li>
              {remaining !== undefined && remaining !== null && (
                <li>
                  • You have{" "}
                  <span className="text-foreground font-medium">
                    {remaining} free transforms
                  </span>{" "}
                  this month
                </li>
              )}
            </ul>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={onDismiss}
          >
            <X className="size-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
