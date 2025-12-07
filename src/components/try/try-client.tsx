"use client";

import { useMutation } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthWallModal } from "@/components/try/auth-wall-modal";
import { SignupNudge } from "@/components/try/signup-nudge";
import { TryInput } from "@/components/try/try-input";
import { TryOutput } from "@/components/try/try-output";
import { Button } from "@/components/ui/button";
import {
  type DemoResult,
  getDemoFromStorage,
  saveDemoToStorage,
} from "@/lib/schemas/demo";
import { useTRPC } from "@/lib/trpc/client";

const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

export function TryClient() {
  const trpc = useTRPC();
  const [result, setResult] = useState<DemoResult | null>(null);
  const [showAuthWall, setShowAuthWall] = useState(false);
  const [hasUsedFreeTry, setHasUsedFreeTry] = useState(false);

  useEffect(() => {
    const storedDemo = getDemoFromStorage();
    if (storedDemo) {
      setResult(storedDemo);
      setHasUsedFreeTry(true);
    }
  }, []);

  const generateMutation = useMutation(
    trpc.guest.generate.mutationOptions({
      onSuccess: async (data) => {
        const demoResult = data as DemoResult;
        setResult(demoResult);
        setHasUsedFreeTry(true);
        saveDemoToStorage(demoResult);
        await confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      },
      onError: (error) => {
        if (error.message.includes("free try")) {
          setShowAuthWall(true);
        } else {
          toast.error("Failed to generate content", {
            description: error.message,
          });
        }
      },
    }),
  );

  const handleGenerate = useCallback(
    (
      content: string,
      platforms: string[],
      options: { tone: string; length: string; persona?: string },
    ) => {
      if (hasUsedFreeTry) {
        setShowAuthWall(true);
        return;
      }

      generateMutation.mutate({
        content,
        platforms: platforms as ("x" | "linkedin" | "tiktok" | "blog")[],
        tone: options.tone as
          | "professional"
          | "casual"
          | "witty"
          | "educational",
        length: options.length as "short" | "medium" | "long",
        persona: options.persona || undefined,
      });
    },
    [generateMutation, hasUsedFreeTry],
  );

  return (
    <div className="min-h-screen relative bg-background text-foreground">
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{ backgroundImage: noiseSvg }}
      />
      <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(oklch(1_0_0/3%)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/3%)_1px,transparent_1px)] bg-size-[60px_60px]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 h-60 w-60 rounded-full bg-chart-2/20 blur-[100px]" />
        <div className="absolute -bottom-20 left-1/3 h-60 w-60 rounded-full bg-chart-3/15 blur-[100px]" />
      </div>

      <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span className="text-sm">Back to home</span>
          </Link>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">Scatter</span>
          </Link>
          <Link href="/login?from=try">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Try Scatter{" "}
            <span className="bg-linear-to-br from-primary via-[oklch(0.8_0.18_50)] to-primary bg-size-[200%_auto] animate-gradient motion-reduce:animate-none bg-clip-text text-transparent">
              Free
            </span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Transform your idea into content for 4 platforms — no signup
            required
          </p>
          {!hasUsedFreeTry && (
            <p className="mt-1 text-sm text-primary">
              ✨ 1 free transformation available
            </p>
          )}
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TryInput
            onGenerate={handleGenerate}
            isGenerating={generateMutation.isPending}
            hasUsedFreeTry={hasUsedFreeTry}
          />
          <TryOutput
            transformations={result?.transformations ?? []}
            isGenerating={generateMutation.isPending}
          />
        </div>

        <AnimatePresence>
          {result && result.transformations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-8"
            >
              <SignupNudge />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showAuthWall && (
          <AuthWallModal
            isOpen={showAuthWall}
            onClose={() => setShowAuthWall(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
