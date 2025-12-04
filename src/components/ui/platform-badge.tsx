import { FileText, Linkedin, Twitter, Video } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const platformConfig = {
  x: {
    name: "X Thread",
    Icon: Twitter,
    color: "text-x-blue",
    bgColor: "bg-x-blue/10",
    borderColor: "border-x-blue/20",
    maxChars: 3500, // Max for 12-tweet thread (12 * 280 + numbering overhead)
  },
  linkedin: {
    name: "LinkedIn",
    Icon: Linkedin,
    color: "text-linkedin-blue",
    bgColor: "bg-linkedin-blue/10",
    borderColor: "border-linkedin-blue/20",
    maxChars: 3000,
  },
  tiktok: {
    name: "TikTok Script",
    Icon: Video,
    color: "text-tiktok-pink",
    bgColor: "bg-tiktok-pink/10",
    borderColor: "border-tiktok-pink/20",
    maxChars: 2200,
  },
  blog: {
    name: "Blog Intro",
    Icon: FileText,
    color: "text-blog-emerald",
    bgColor: "bg-blog-emerald/10",
    borderColor: "border-blog-emerald/20",
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
  sm: "h-3.5 w-3.5",
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
        "flex shrink-0 items-center justify-center transition-colors",
        sizeClasses[size],
        config.bgColor,
        config.color,
        className,
      )}
    >
      <Icon className={iconSizeClasses[size]} />
    </div>
  );
}
