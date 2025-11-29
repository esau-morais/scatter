import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { waitlist } from "@/db/schema";
import * as schema from "./auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: false,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email.toLowerCase();
          const [entry] = await db
            .select()
            .from(waitlist)
            .where(and(eq(waitlist.email, email), eq(waitlist.approved, true)))
            .limit(1);

          if (!entry) {
            throw new APIError("FORBIDDEN", { message: "not_approved" });
          }

          return { data: user };
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
