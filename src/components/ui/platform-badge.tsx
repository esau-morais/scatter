import { FileText } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { Linkedin, Tiktok, X } from "./svgs";

export const platformConfig = {
  x: {
    name: "X Thread",
    Icon: X,
    maxChars: 3500,
  },
  linkedin: {
    name: "LinkedIn",
    Icon: Linkedin,
    maxChars: 3000,
  },
  tiktok: {
    name: "TikTok Script",
    Icon: Tiktok,
    maxChars: 2200,
  },
  blog: {
    name: "Blog Intro",
    Icon: FileText,
    maxChars: 1000,
  },
} as const;

export type PlatformType = keyof typeof platformConfig;

interface PlatformBadgeProps extends ComponentProps<"div"> {
  platform: PlatformType;
  size?: "sm" | "default" | "lg";
}

const sizeClasses = {
  sm: "h-7 w-7 rounded-md",
  default: "h-9 w-9 rounded-lg",
  lg: "h-11 w-11 rounded-lg",
};

const iconSizeClasses = {
  sm: "size-3.5",
  default: "h-4 w-4",
  lg: "h-5 w-5",
};

export function PlatformBadge({
  platform,
  size = "default",
  className,
}: PlatformBadgeProps) {
  const config = platformConfig[platform];
  const Icon = config.Icon;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center",
        sizeClasses[size],
        className,
      )}
    >
      <Icon className={iconSizeClasses[size]} />
    </div>
  );
}
