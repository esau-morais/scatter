"use client";

import { History, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view");

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Scatter</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              pathname === "/dashboard" && !currentView && "bg-accent",
            )}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Create
          </Link>
          <Link
            href="/dashboard?view=history"
            className={cn(
              buttonVariants({ size: "sm", variant: "ghost" }),
              pathname === "/dashboard" &&
                currentView === "history" &&
                "bg-accent",
            )}
          >
            <History className="mr-1.5 h-4 w-4" />
            History
          </Link>
          {/* <Button variant="ghost" size="icon" asChild> */}
          {/*   <Link href="/dashboard/settings"> */}
          {/*     <Settings className="h-4 w-4" /> */}
          {/*   </Link> */}
          {/* </Button> */}
        </div>
      </div>
    </header>
  );
}
