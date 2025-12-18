"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { CSSProperties } from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "border-l-4! backdrop-blur-sm! shadow-lg!",
          success:
            "border-l-success! bg-success/10! text-foreground! shadow-success/20!",
          error:
            "border-l-destructive! bg-destructive/10! text-foreground! shadow-destructive/20!",
          warning:
            "border-l-warning! bg-warning/10! text-foreground! shadow-warning/20!",
          info: "border-l-coral! bg-coral/10! text-foreground! shadow-coral/20!",
          closeButton: "right-0! translate-x-2/3 left-[unset]!",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-success" />,
        info: <InfoIcon className="size-4 text-coral" />,
        warning: <TriangleAlertIcon className="size-4 text-warning" />,
        error: <OctagonXIcon className="size-4 text-destructive" />,
        loading: (
          <Loader2Icon className="size-4 text-coral animate-spin motion-reduce:animate-none" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      {...props}
    />
  );
};
