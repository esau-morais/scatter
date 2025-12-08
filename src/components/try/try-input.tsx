"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Settings2,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Linkedin, Tiktok, X } from "@/components/ui/svgs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const platforms = [
  { id: "x", name: "X Thread", Icon: X },
  { id: "linkedin", name: "LinkedIn", Icon: Linkedin },
  { id: "tiktok", name: "TikTok Script", Icon: Tiktok },
  { id: "blog", name: "Blog Intro", Icon: FileText },
] as const;

const toneOptions = [
  {
    id: "professional",
    label: "Professional",
    description: "Formal & polished",
  },
  { id: "casual", label: "Casual", description: "Friendly & relaxed" },
  { id: "witty", label: "Witty", description: "Clever & humorous" },
  {
    id: "educational",
    label: "Educational",
    description: "Informative & clear",
  },
] as const;

const lengthOptions = [
  { id: "short", label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long", label: "Long" },
] as const;

const EXAMPLE_CONTENT = `The best marketing doesn't feel like marketing. It feels like a friend sharing something valuable. Stop selling. Start helping.`;

const seedSchema = z.object({
  seed: z.string().trim().min(10, "Please enter at least 10 characters."),
  platforms: z.array(z.string()).min(1, "Please select at least one platform."),
  tone: z.enum(["professional", "casual", "witty", "educational"]),
  length: z.enum(["short", "medium", "long"]),
  persona: z.string(),
});

type SeedFormValues = z.infer<typeof seedSchema>;

interface TryInputProps {
  onGenerate: (
    content: string,
    platforms: string[],
    options: { tone: string; length: string; persona?: string },
  ) => void;
  isGenerating: boolean;
  hasUsedFreeTry: boolean;
}

export function TryInput({
  onGenerate,
  isGenerating,
  hasUsedFreeTry,
}: TryInputProps) {
  const [showOptions, setShowOptions] = useState(false);

  const form = useForm<SeedFormValues>({
    resolver: zodResolver(seedSchema),
    defaultValues: {
      seed: EXAMPLE_CONTENT,
      platforms: platforms.map((p) => p.id),
      tone: "professional",
      length: "medium",
      persona: "",
    },
  });

  const {
    seed,
    platforms: selectedPlatforms,
    tone,
    length,
    persona,
  } = form.watch();

  const onSubmit = useCallback(
    (values: SeedFormValues) => {
      if (isGenerating) return;
      onGenerate(values.seed, values.platforms, {
        tone: values.tone,
        length: values.length,
        persona: values.persona || undefined,
      });
    },
    [onGenerate, isGenerating],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        form.handleSubmit(onSubmit)();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [form, onSubmit]);

  const isCustomized =
    tone !== "professional" || length !== "medium" || persona;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card className="border-border/50 bg-card/50 p-6 backdrop-blur-sm">
          <header className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Core Idea</h2>
            <span className="text-xs text-muted-foreground">
              {seed.length} characters
            </span>
          </header>

          <FormField
            control={form.control}
            name="seed"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormControl>
                  <Textarea
                    placeholder="Drop your idea here... It can be a concept, voice note transcript, or rough draft."
                    className="min-h-48 resize-none border-border bg-secondary/50 font-mono text-sm leading-relaxed transition-all focus:bg-secondary/70"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="platforms"
            render={() => (
              <FormItem className="mb-4">
                <FormLabel className="text-xs text-muted-foreground">
                  Transform to:
                </FormLabel>
                <fieldset className="grid grid-cols-2 gap-2">
                  {platforms.map((platform) => {
                    const isSelected = selectedPlatforms.includes(platform.id);
                    return (
                      <FormField
                        key={platform.id}
                        control={form.control}
                        name="platforms"
                        render={({ field }) => (
                          <Label
                            htmlFor={`try-platform-${platform.id}`}
                            className={cn(
                              "group flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all",
                              isSelected
                                ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_oklch(0.72_0.19_30/15%)]"
                                : "border-border bg-secondary/30 hover:border-border hover:bg-secondary/50",
                            )}
                          >
                            <Checkbox
                              id={`try-platform-${platform.id}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                const current = field.value;
                                field.onChange(
                                  checked
                                    ? [...(current || []), platform.id]
                                    : current?.filter(
                                        (id) => id !== platform.id,
                                      ),
                                );
                              }}
                              className="sr-only"
                            />
                            <span
                              className={cn(
                                "flex size-7 items-center justify-center rounded-md transition-all",
                                isSelected ? "bg-primary/20" : "bg-background",
                              )}
                            >
                              <platform.Icon className="size-3.5" />
                            </span>
                            <span
                              className={cn(
                                "font-medium",
                                isSelected
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {platform.name}
                            </span>
                            {isSelected && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="ml-auto h-1.5 w-1.5 rounded-full bg-primary"
                                aria-hidden
                              />
                            )}
                          </Label>
                        )}
                      />
                    );
                  })}
                </fieldset>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mb-4">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              aria-expanded={showOptions}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2.5 text-sm transition-all hover:bg-secondary/50"
            >
              <span className="flex items-center gap-2">
                <Settings2 className="size-4 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">
                  Style Options
                </span>
                {isCustomized && (
                  <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Customized
                  </span>
                )}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 text-muted-foreground transition-transform duration-200",
                  showOptions && "rotate-180",
                )}
              />
            </button>

            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-4 rounded-lg border border-border bg-secondary/20 p-4">
                    <FormField
                      control={form.control}
                      name="tone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Tone
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-2 gap-2"
                            >
                              {toneOptions.map((option) => (
                                <Label
                                  key={option.id}
                                  htmlFor={`try-tone-${option.id}`}
                                  className={cn(
                                    "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs transition-all [&:has([data-state=checked])]:border-primary/50 [&:has([data-state=checked])]:bg-primary/10",
                                    "border-border bg-background text-muted-foreground hover:bg-secondary/50",
                                  )}
                                >
                                  <RadioGroupItem
                                    value={option.id}
                                    id={`try-tone-${option.id}`}
                                    className="sr-only"
                                  />
                                  <span className="flex flex-col">
                                    <span className="font-medium">
                                      {option.label}
                                    </span>
                                    <span className="text-[10px] opacity-70">
                                      {option.description}
                                    </span>
                                  </span>
                                </Label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Length
                          </FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              value={field.value}
                              className="grid grid-cols-3 gap-2"
                            >
                              {lengthOptions.map((option) => (
                                <Label
                                  key={option.id}
                                  htmlFor={`try-length-${option.id}`}
                                  className={cn(
                                    "flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-xs font-medium transition-all [&:has([data-state=checked])]:border-primary/50 [&:has([data-state=checked])]:bg-primary/10 [&:has([data-state=checked])]:text-foreground",
                                    "border-border bg-background text-muted-foreground hover:bg-secondary/50",
                                  )}
                                >
                                  <RadioGroupItem
                                    value={option.id}
                                    id={`try-length-${option.id}`}
                                    className="sr-only"
                                  />
                                  {option.label}
                                </Label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="persona"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">
                            Write as... (optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g. a startup founder, marketing expert..."
                              className="h-9 bg-background text-sm"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <footer className="space-y-3">
            <Button
              type="submit"
              className="w-full shadow-[0_0_40px_oklch(0.72_0.19_30/30%),0_0_80px_oklch(0.72_0.19_30/15%)] transition-all hover:shadow-[0_0_60px_oklch(0.72_0.19_30/40%),0_0_100px_oklch(0.72_0.19_30/20%)]"
              disabled={!form.formState.isValid || isGenerating}
            >
              {isGenerating ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "linear",
                    }}
                  >
                    <Sparkles className="mr-2 size-4" />
                  </motion.span>
                  Transforming...
                </>
              ) : hasUsedFreeTry ? (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Sign Up to Transform Again
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 size-4" />
                  Generate (1 Free)
                </>
              )}
            </Button>

            <Link href="/login?from=try" className="block">
              <Button
                type="button"
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                Skip & Sign Up
                <ChevronRight className="ml-1 size-4" />
              </Button>
            </Link>
          </footer>
        </Card>
      </form>
    </Form>
  );
}
