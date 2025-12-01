import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { polar } from "@/lib/polar";

const checkoutSchema = z.object({
  planId: z.string(),
});

const PLAN_IDS = {
  creator: "cca63744-a831-4534-8af6-38d1a08d2f29",
  pro: "789-ghi-012-jkl",
};

export async function POST(req: NextRequest) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const result = checkoutSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { planId } = result.data;

  if (!Object.values(PLAN_IDS).includes(planId)) {
    return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
  }

  try {
    const checkout = await polar.checkouts.create({
      products: [planId],
      customerEmail: session.user.email,
      customerName: session.user.name || undefined,
      successUrl: `${req.nextUrl.origin}/dashboard`,
      embedOrigin: req.nextUrl.origin,
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error) {
    console.error("Polar checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
