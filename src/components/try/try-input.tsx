"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronRight, FileText, Settings2, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
                                : "border-border bg-secondary/50 hover:border-border hover:bg-secondary/70",
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

          <footer className="space-y-3">
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(
                      "shrink-0",
                      isCustomized && "border-primary/50 bg-primary/10",
                    )}
                  >
                    <Settings2 className="size-4" />
                    <span className="sr-only">Style Options</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="font-medium">Style Options</h4>
                      <p className="text-xs text-muted-foreground">
                        Customize tone, length, and persona
                      </p>
                    </div>

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
                              className="grid grid-cols-2 gap-1.5"
                            >
                              {toneOptions.map((option) => (
                                <Label
                                  key={option.id}
                                  htmlFor={`try-tone-${option.id}`}
                                  className={cn(
                                    "flex cursor-pointer items-center rounded-md border px-2.5 py-1.5 text-xs transition-all [&:has([data-state=checked])]:border-primary/50 [&:has([data-state=checked])]:bg-primary/10",
                                    "border-border bg-background text-muted-foreground hover:bg-secondary/50",
                                  )}
                                >
                                  <RadioGroupItem
                                    value={option.id}
                                    id={`try-tone-${option.id}`}
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
                              className="grid grid-cols-3 gap-1.5"
                            >
                              {lengthOptions.map((option) => (
                                <Label
                                  key={option.id}
                                  htmlFor={`try-length-${option.id}`}
                                  className={cn(
                                    "flex cursor-pointer items-center justify-center rounded-md border px-2.5 py-1.5 text-xs font-medium transition-all [&:has([data-state=checked])]:border-primary/50 [&:has([data-state=checked])]:bg-primary/10 [&:has([data-state=checked])]:text-foreground",
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
                              placeholder="e.g. startup founder, tech blogger..."
                              className="h-8 text-sm"
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                type="submit"
                className="flex-1 shadow-[0_0_40px_oklch(0.72_0.19_30/30%),0_0_80px_oklch(0.72_0.19_30/15%)] transition-all hover:shadow-[0_0_60px_oklch(0.72_0.19_30/40%),0_0_100px_oklch(0.72_0.19_30/20%)]"
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
            </div>

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
