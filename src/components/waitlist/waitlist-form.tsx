"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { TRPCError } from "@trpc/server";
import { ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTRPC } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const waitlistSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

type WaitlistFormValues = z.infer<typeof waitlistSchema>;

type WaitlistFormProps = {
  variant?: "hero" | "cta" | "inline";
  className?: string;
};

export function WaitlistForm({
  variant = "hero",
  className,
}: WaitlistFormProps) {
  const trpc = useTRPC();
  const joinMutation = useMutation(trpc.waitlist.join.mutationOptions());

  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: WaitlistFormValues) => {
    try {
      await joinMutation.mutateAsync(values);
      form.reset();
    } catch (err) {
      if (err instanceof TRPCError && err?.message === "already_joined") {
        form.setError("email", {
          message: "You're already on the list!",
        });
      } else {
        form.setError("email", {
          message: "Something went wrong. Try again.",
        });
      }
    }
  };

  if (joinMutation.isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "flex items-center gap-3 rounded-full border border-primary/30 bg-primary/10 px-6 py-4",
          className,
        )}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
        >
          <CheckCircle2 className="size-5 text-primary" />
        </motion.div>
        <span className="font-medium text-primary">You're on the list!</span>
        <Sparkles className="size-4 text-primary motion-safe:animate-pulse" />
      </motion.div>
    );
  }

  const isHero = variant === "hero";
  const isCta = variant === "cta";

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("w-full max-w-md", className)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <div
                className={cn(
                  "relative flex items-center gap-2 rounded-full border bg-secondary/50 backdrop-blur-sm transition-all duration-300",
                  "focus-within:border-primary/50 focus-within:bg-secondary/80",
                  "hover:border-border/80",
                  isHero || isCta ? "p-1.5 pl-5" : "p-1 pl-4",
                  form.formState.errors.email && "border-destructive/50",
                )}
              >
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className={cn(
                      "flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60",
                      isHero || isCta ? "text-base" : "text-sm",
                    )}
                    disabled={joinMutation.isPending}
                    {...field}
                  />
                </FormControl>
                <Button
                  type="submit"
                  size={isHero || isCta ? "default" : "sm"}
                  disabled={joinMutation.isPending}
                  className={cn(
                    "rounded-full transition-all",
                    "shadow-[0_0_20px_oklch(0.72_0.19_30/20%)]",
                    "disabled:shadow-none",
                    isHero || isCta ? "px-6" : "px-4",
                  )}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {joinMutation.isPending ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <span className="hidden sm:inline">Join Waitlist</span>
                        <span className="sm:hidden">Join</span>
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
              <AnimatePresence>
                {form.formState.errors.email && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    <FormMessage />
                  </motion.div>
                )}
              </AnimatePresence>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
