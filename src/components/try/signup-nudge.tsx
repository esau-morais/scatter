"use client";

import { Loader2, PartyPopper } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Github, Google } from "@/components/ui/svgs";
import { authClient } from "@/lib/auth/auth-client";

export function SignupNudge() {
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard?from=try",
        errorCallbackURL: "/login?error=auth_failed",
      });
    } catch {
      setIsLoadingGoogle(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoadingGithub(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard?from=try",
        errorCallbackURL: "/login?error=auth_failed",
      });
    } catch {
      setIsLoadingGithub(false);
    }
  };

  const isLoading = isLoadingGoogle || isLoadingGithub;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-primary/30 bg-primary/5 p-6 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <PartyPopper className="size-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Like what you see?</h3>
            <p className="text-sm text-muted-foreground">
              Sign up to save your content and get{" "}
              <span className="font-medium text-foreground">
                10 free transformations
              </span>{" "}
              every month
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoadingGoogle ? (
                <Loader2 className="mr-2 size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <Google className="mr-2 size-4" />
              )}
              Google
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGithubLogin}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoadingGithub ? (
                <Loader2 className="mr-2 size-4 animate-spin motion-reduce:animate-none" />
              ) : (
                <Github className="mr-2 size-4" />
              )}
              GitHub
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
