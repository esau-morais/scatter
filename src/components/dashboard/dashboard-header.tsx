"use client";

import { History, Plus, Sparkles } from "lucide-react";
import type { Route } from "next";
import Link, { LinkProps } from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsList } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");

  const createHref: Route = fromParam
    ? `/dashboard?from=${fromParam}`
    : "/dashboard";
  const historyHref: Route = fromParam
    ? `/dashboard/history?from=${fromParam}`
    : "/dashboard/history";

  const isHistory = pathname === "/dashboard/history";

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Scatter</span>
        </div>
        <Tabs>
          <TabsList>
            <Link
              href={createHref}
              className={cn(
                "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                !isHistory &&
                  "bg-background dark:text-foreground shadow-sm border-input dark:bg-input/30",
              )}
            >
              <Plus className="mr-1.5 size-4" />
              Create
            </Link>
            <Link
              href={historyHref}
              className={cn(
                "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                isHistory &&
                  "bg-background dark:text-foreground shadow-sm border-input dark:bg-input/30",
              )}
            >
              <History className="mr-1.5 size-4" />
              History
            </Link>
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
}
