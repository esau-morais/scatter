import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { TryClient } from "@/components/try/try-client";
import { auth } from "@/lib/auth";

export default async function TryPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return <TryClient />;
}
