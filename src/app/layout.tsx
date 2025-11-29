import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCReactProvider } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import "./globals.css";
import type { ReactNode } from "react";

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
    <html lang="en">
      <body
        className={cn("antialiased", geistSans.variable, geistMono.variable)}
      >
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
