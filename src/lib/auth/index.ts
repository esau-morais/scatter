import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { lastLoginMethod } from "better-auth/plugins";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { waitlist } from "@/db/schema";
import * as schema from "./auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: false,
  },
  account: {
    accountLinking: {
      enabled: true,
      // Allow linking accounts with different email addresses (e.g., LinkedIn with different domain)
      allowDifferentEmails: true,
      trustedProviders: ["google", "github", "twitter", "linkedin"],
    },
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
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      // Required scopes for posting tweets (per X API v2 docs)
      // https://docs.x.com/fundamentals/authentication/guides/v2-authentication-mapping
      scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    },
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      // Required scopes for posting to LinkedIn
      scope: ["openid", "profile", "email", "w_member_social"],
    },
  },
  plugins: [lastLoginMethod()],
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const email = user.email.toLowerCase();
          const normalizedEmail = email.replace(/\+[^@]+@/, "@");

          const entry = await db.query.waitlist.findFirst({
            where: and(
              eq(waitlist.email, normalizedEmail),
              eq(waitlist.approved, true),
            ),
          });

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
