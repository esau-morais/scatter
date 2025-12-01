"use client";

import { PolarEmbedCheckout } from "@polar-sh/checkout/embed";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface CheckoutButtonProps {
  planId: string;
  planName: string;
}

export function CheckoutButton({ planId, planName }: CheckoutButtonProps) {
  const checkoutInstanceRef = useRef<Awaited<
    ReturnType<typeof PolarEmbedCheckout.create>
  > | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  useEffect(() => {
    PolarEmbedCheckout.init();
  }, []);

  useEffect(() => {
    return () => {
      if (checkoutInstanceRef.current) {
        checkoutInstanceRef.current.close();
      }
    };
  }, []);

  const handleCheckout = async () => {
    setLoading(true);

    try {
      const checkoutUrl = new URL("/api/checkout", window.location.origin);

      const res = await fetch(checkoutUrl.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();

      if (res.ok && data.url) {
        const checkout = await PolarEmbedCheckout.create(data.url, "dark");
        checkoutInstanceRef.current = checkout;

        checkout.addEventListener("success", (event: CustomEvent) => {
          // Prevent Polar's automatic redirect
          event.preventDefault();
          // Refresh the page to show updated plan status
          router.refresh();
        });

        checkout.addEventListener("close", () => {
          console.log("Checkout closed");
          checkoutInstanceRef.current = null;
        });

        checkout.addEventListener("confirmed", () => {
          // Payment is being processed
        });
      } else {
        console.error(
          "Checkout failed or missing checkoutLink:",
          data.error || "No checkout link returned",
        );
      }
    } catch (error) {
      console.error("An error occurred during checkout:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleCheckout} disabled={loading} className="w-full">
      {loading ? "Loading..." : `Subscribe to ${planName}`}
    </Button>
  );
}
