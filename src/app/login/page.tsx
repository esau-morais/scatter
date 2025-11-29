import { Sparkles } from "lucide-react";
import Link from "next/link";
import { LoginContainer, LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";

const noiseSvg = `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;

export default function LoginPage() {
  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background">
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{ backgroundImage: noiseSvg }}
      />
      <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(oklch(1_0_0/3%)_1px,transparent_1px),linear-gradient(90deg,oklch(1_0_0/3%)_1px,transparent_1px)] bg-size-[60px_60px]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-20 h-60 w-60 rounded-full bg-chart-2/20 blur-[100px]" />
        <div className="absolute -bottom-20 left-1/3 h-60 w-60 rounded-full bg-chart-3/15 blur-[100px]" />
      </div>

      <LoginContainer>
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">Scatter</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to continue to your dashboard
          </p>
        </div>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-6">
          <LoginForm />

          <div className="mt-6 text-center text-sm text-muted-foreground">
            By continuing, you agree to our{" "}
            <Link href="/" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/" className="text-primary hover:underline">
            Join the waitlist
          </Link>
        </p>
      </LoginContainer>
    </div>
  );
}
