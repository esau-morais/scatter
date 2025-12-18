"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, X as XIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Linkedin, X } from "@/components/ui/svgs";
import { authClient } from "@/lib/auth/auth-client";
import { useTRPC } from "@/lib/trpc/client";

export function ConnectedAccounts() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: connectedAccounts, isLoading } = useQuery(
    trpc.transformations.getConnectedAccounts.queryOptions(),
  );

  const disconnectMutation = useMutation(
    trpc.transformations.disconnectAccount.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.transformations.getConnectedAccounts.queryOptions(),
        );
        toast.success("Account disconnected successfully");
      },
      onError: (error) => {
        toast.error("Failed to disconnect account", {
          description: error.message,
        });
      },
    }),
  );

  const [connectingProvider, setConnectingProvider] = useState<
    "twitter" | "linkedin" | null
  >(null);

  const handleConnect = async (provider: "twitter" | "linkedin") => {
    setConnectingProvider(provider);
    try {
      // Use linkSocial instead of signIn.social to link to existing account
      // This avoids triggering the waitlist check for new user creation
      await authClient.linkSocial({
        provider,
        callbackURL: "/dashboard/settings",
      });
    } catch (_error) {
      setConnectingProvider(null);
      toast.error(
        `Failed to connect ${provider === "twitter" ? "X" : "LinkedIn"}`,
      );
    }
  };

  const handleDisconnect = (provider: "twitter" | "linkedin") => {
    disconnectMutation.mutate({ provider });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/50 p-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-lg" />
                <div>
                  <Skeleton className="mb-1 h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const platforms = [
    {
      id: "twitter" as const,
      name: "X (Twitter)",
      icon: X,
      connected: connectedAccounts?.twitter ?? false,
    },
    {
      id: "linkedin" as const,
      name: "LinkedIn",
      icon: Linkedin,
      connected: connectedAccounts?.linkedin ?? false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Connected Accounts</h2>
        <p className="text-sm text-muted-foreground">
          Connect your social media accounts to publish directly from Scatter
        </p>
      </div>

      <div className="space-y-3">
        {platforms.map((platform) => {
          const Icon = platform.icon;
          const isConnecting = connectingProvider === platform.id;
          const isDisconnecting =
            disconnectMutation.isPending &&
            disconnectMutation.variables?.provider === platform.id;

          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-lg border border-border/70 bg-secondary/50 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-secondary">
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-medium">{platform.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {platform.connected
                      ? "Connected - Ready to publish"
                      : "Not connected"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {platform.connected ? (
                  <>
                    <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-xs text-success">
                      <Check className="size-3" />
                      <span>Connected</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(platform.id)}
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting ? (
                        <>
                          <Loader2 className="mr-2 size-3 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <XIcon className="mr-2 size-3" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 size-3 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Note:</strong> X free tier allows
          17 posts per day across all users. LinkedIn allows 150 posts per day
          per user.
        </p>
      </div>
    </div>
  );
}
