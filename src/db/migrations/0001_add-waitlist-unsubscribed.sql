ALTER TABLE "waitlist" ADD COLUMN "approved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "waitlist" ADD COLUMN "unsubscribed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DROP TYPE "public"."plan";