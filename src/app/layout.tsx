import { MotionConfig } from "motion/react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCReactProvider } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import "./globals.css";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scatter – Write Once, Distribute Everywhere",
  description:
    "Transform your ideas into platform-perfect content for X, LinkedIn, TikTok, and more. One input, four outputs. Stop the content burnout.",
  keywords: [
    "content repurposing",
    "social media",
    "content creator",
    "AI writing",
    "multi-platform",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn("antialiased", geistSans.variable, geistMono.variable)}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <MotionConfig reducedMotion="user">
            <TRPCReactProvider>
              {children}
              <Toaster position="top-center" />
            </TRPCReactProvider>
          </MotionConfig>
        </ThemeProvider>
      </body>
    </html>
  );
}
