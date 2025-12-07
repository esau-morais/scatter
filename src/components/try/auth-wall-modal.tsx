"use client";

import { Loader2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, Google } from "@/components/ui/svgs";
import { authClient } from "@/lib/auth/auth-client";

interface AuthWallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthWallModal({ isOpen, onClose }: AuthWallModalProps) {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard?from=try",
        errorCallbackURL: "/login?error=auth_failed",
      });
    } catch {
      setError("Failed to sign in with Google. Please try again.");
      setIsLoadingGoogle(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoadingGithub(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard?from=try",
        errorCallbackURL: "/login?error=auth_failed",
      });
    } catch {
      setError("Failed to sign in with GitHub. Please try again.");
      setIsLoadingGithub(false);
    }
  };

  const isLoading = isLoadingGoogle || isLoadingGithub;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
          >
            <Sparkles className="size-8 text-primary" />
          </motion.div>

          <h2 className="mb-2 text-2xl font-bold">
            You've used your free try!
          </h2>
          <p className="mb-6 text-muted-foreground">
            Sign up to get{" "}
            <span className="font-semibold text-foreground">
              10 free transformations
            </span>{" "}
            every month
          </p>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-12 text-base"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              {isLoadingGoogle ? (
                <Loader2 className="mr-2 size-5 animate-spin motion-reduce:animate-none" />
              ) : (
                <Google className="mr-2 size-5" />
              )}
              Sign up with Google
            </Button>

            <Button
              variant="outline"
              className="w-full h-12 text-base"
              onClick={handleGithubLogin}
              disabled={isLoading}
            >
              {isLoadingGithub ? (
                <Loader2 className="mr-2 size-5 animate-spin motion-reduce:animate-none" />
              ) : (
                <Github className="mr-2 size-5" />
              )}
              Sign up with GitHub
            </Button>
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <p className="mt-6 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login?from=try"
              className="text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
