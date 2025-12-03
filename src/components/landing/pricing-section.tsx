"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { CheckoutButton } from "@/components/billing/checkout-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { authClient } from "@/lib/auth/auth-client";
import { PLAN_IDS } from "@/lib/polar/plans";
import { cn } from "@/lib/utils";

const pricing = [
  {
    name: "Free",
    price: "$0",
    description: "Try the magic",
    features: [
      "10 transformations/month",
      "All 4 platforms",
      "Copy to clipboard",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Creator",
    price: "$9",
    period: "/mo",
    description: "For active creators",
    features: [
      "100 transformations/month",
      "Priority AI processing",
      "Transformation history",
      "Early access to features",
    ],
    cta: "Start Creating",
    highlighted: true,
    planId: PLAN_IDS.creator,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/mo",
    description: "Unlimited power",
    features: [
      "Unlimited transformations",
      "Premium AI models",
      "Custom tone presets",
      "Priority support",
    ],
    cta: "Go Pro",
    highlighted: false,
    planId: PLAN_IDS.pro,
  },
];

export function PricingSection() {
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.session;

  const PlanLink = (plan: (typeof pricing)[number]) => (
    <Link
      className={cn(
        "w-full",
        buttonVariants({
          variant: plan.highlighted ? "default" : "outline",
        }),
      )}
      href={isAuthenticated ? "/dashboard" : "/login"}
    >
      {plan.cta}
    </Link>
  );

  return (
    <section className="relative py-24 z-10">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          className="mb-16 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Badge variant="secondary" className="mb-6">
            Pricing
          </Badge>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Simple pricing for creators
          </h2>
          <p className="text-muted-foreground">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {pricing.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card
                className={cn(
                  "relative h-full border-border/50 bg-card/50 p-6 backdrop-blur-sm",
                  plan.highlighted
                    ? "shadow-[0_0_40px_oklch(0.72_0.19_30/30%),0_0_80px_oklch(0.72_0.19_30/15%)] border-primary/50 bg-card/80"
                    : "hover:border-border",
                )}
              >
                {plan.highlighted && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                <div className="mb-6">
                  <h3 className="mb-1 text-lg font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <ul className="mb-8 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm"
                    >
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.planId && isAuthenticated ? (
                  <CheckoutButton planId={plan.planId} planName={plan.name} />
                ) : (
                  <PlanLink {...plan} />
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
