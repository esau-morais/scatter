import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome back, {session?.user?.name || "User"}
      </p>
    </div>
  );
}
