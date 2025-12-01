import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { user } from "@/lib/auth/auth-schema";
import { polar } from "@/lib/polar";

export async function GET(req: NextRequest) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const [currentUser] = await db
      .select({ polarCustomerId: user.polarCustomerId })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!currentUser?.polarCustomerId) {
      return NextResponse.json({ error: "No customer found" }, { status: 404 });
    }

    const result = await polar.customerSessions.create({
      customerId: currentUser.polarCustomerId,
    });

    return NextResponse.redirect(result.customerPortalUrl);
  } catch (error) {
    console.error("Polar portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
}
