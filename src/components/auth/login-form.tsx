"use client";

import { Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, Google } from "@/components/ui/svgs";
import { authClient } from "@/lib/auth/auth-client";
import { Badge } from "../ui/badge";

export function LoginContainer({ children }: { children: ReactNode }) {
  return (
    <motion.div
      className="relative z-10 w-full max-w-md px-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}

function LastUsedBadge() {
  return <Badge className="absolute -top-2.5 -right-2.5">Last used</Badge>;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingGithub, setIsLoadingGithub] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastMethod = useMemo(() => authClient.getLastUsedLoginMethod(), []);

  const fromParam = searchParams.get("from");
  const callbackURL = fromParam ? `/dashboard?from=${fromParam}` : "/dashboard";
  const errorCallbackURL = fromParam ? `/login?from=${fromParam}` : "/login";

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (errorParam === "not_approved")
        setError("Access denied. Join wailist first to get early access.");
      else setError(errorParam);
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    setError(null);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
        errorCallbackURL,
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
        callbackURL,
        errorCallbackURL,
      });
    } catch {
      setError("Failed to sign in with GitHub. Please try again.");
      setIsLoadingGithub(false);
    }
  };

  const isLoading = isLoadingGoogle || isLoadingGithub;

  return (
    <div className="space-y-4">
      <div className="relative">
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
          Continue with Google
        </Button>
        {lastMethod === "google" && <LastUsedBadge />}
      </div>

      <div className="relative">
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
          Continue with GitHub
        </Button>
        {lastMethod === "github" && <LastUsedBadge />}
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}
    </div>
  );
}
