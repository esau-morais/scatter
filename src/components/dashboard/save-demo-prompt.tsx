"use client";

import { Loader2, Save, Sparkles, X } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SaveDemoPromptProps {
  transformationCount: number;
  onSave: () => void;
  onDismiss: () => void;
  isSaving: boolean;
}

export function SaveDemoPrompt({
  transformationCount,
  onSave,
  onDismiss,
  isSaving,
}: SaveDemoPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-primary/30 bg-primary/5 p-4 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">Save your demo transformation?</h3>
            <p className="text-sm text-muted-foreground">
              You created {transformationCount} platform
              {transformationCount > 1 ? "s" : ""} worth of content on the try
              page. Save it to your account to access it later.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              disabled={isSaving}
            >
              <X className="size-4 mr-1" />
              Dismiss
            </Button>
            <Button size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin motion-reduce:animate-none" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-2" />
                  Save to Account
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
