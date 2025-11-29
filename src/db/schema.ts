import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "@/lib/auth/auth-schema";

export const platformEnum = pgEnum("platform", [
  "x",
  "linkedin",
  "tiktok",
  "blog",
]);

export const seeds = pgTable("seeds", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const transformations = pgTable("transformations", {
  id: uuid("id").primaryKey().defaultRandom(),
  seedId: uuid("seed_id")
    .notNull()
    .references(() => seeds.id, { onDelete: "cascade" }),
  platform: platformEnum("platform").notNull(),
  content: text("content").notNull(),
  postedAt: timestamp("posted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Seed = typeof seeds.$inferSelect;
export type NewSeed = typeof seeds.$inferInsert;

export type Transformation = typeof transformations.$inferSelect;
export type NewTransformation = typeof transformations.$inferInsert;

export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;
