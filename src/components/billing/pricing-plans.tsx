import { Check } from "lucide-react";
import { Button } from "@/components/ui/button"; // Import Button component
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PLAN_IDS } from "@/lib/polar/plans";
import { CheckoutButton } from "./checkout-button";

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "For getting started",
    features: ["10 transformations/month", "Basic AI models"],
  },
  {
    name: "Creator",
    price: "$9",
    planId: PLAN_IDS.creator,
    description: "For solo creators",
    features: ["100 transformations/month", "Standard AI models"],
  },
  {
    name: "Pro",
    price: "$19",
    planId: PLAN_IDS.pro,
    description: "For power users and teams",
    features: ["Unlimited transformations", "Priority AI models"],
  },
];

type PricingPlansProps = {
  currentPlanId?: string;
};

export function PricingPlans({ currentPlanId }: PricingPlansProps) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent =
          plan.planId === currentPlanId ||
          (!plan.planId && !currentPlanId && plan.name === "Free");
        return (
          <Card
            key={plan.name}
            className={isCurrent ? "border-primary relative" : ""} // Added relative for the badge positioning
          >
            {isCurrent && (
              <span className="absolute -top-3 -right-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                Current Plan
              </span>
            )}
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold">
                {plan.price}
                {plan.price !== "$0" && (
                  <span className="text-sm font-normal">/mo</span>
                )}
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="mr-2 size-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isCurrent ? (
                plan.planId ? (
                  <form action="/api/portal" method="GET">
                    <Button type="submit" variant="outline" className="w-full">
                      Manage Subscription
                    </Button>
                  </form>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    This is your current plan.
                  </p>
                )
              ) : plan.planId ? (
                <CheckoutButton planId={plan.planId} planName={plan.name} />
              ) : (
                <Button variant="secondary" className="w-full" disabled>
                  Select Plan
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
