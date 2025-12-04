import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "@/lib/auth/auth-schema";

export const platformEnum = pgEnum("platform", [
  "x",
  "linkedin",
  "tiktok",
  "blog",
]);

export const seeds = pgTable(
  "seeds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title"),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("seeds_user_id_idx").on(table.userId)],
);

export const transformations = pgTable(
  "transformations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seedId: uuid("seed_id")
      .notNull()
      .references(() => seeds.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    content: text("content").notNull(),
    postedAt: timestamp("posted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("transformations_seed_id_idx").on(table.seedId)],
);

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usageStats = pgTable(
  "usage_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    month: timestamp("month").notNull(),
    seedsCreated: integer("seeds_created").notNull().default(0),
    transformationsCreated: integer("transformations_created")
      .notNull()
      .default(0),
    transformationsPosted: integer("transformations_posted")
      .notNull()
      .default(0),
  },
  (table) => [
    uniqueIndex("usage_stats_user_month_idx").on(table.userId, table.month),
  ],
);

export const seedsRelations = relations(seeds, ({ many }) => ({
  transformations: many(transformations),
}));

export const transformationsRelations = relations(
  transformations,
  ({ one }) => ({
    seed: one(seeds, {
      fields: [transformations.seedId],
      references: [seeds.id],
    }),
  }),
);

export type Seed = typeof seeds.$inferSelect;
export type NewSeed = typeof seeds.$inferInsert;

export type Transformation = typeof transformations.$inferSelect;
export type NewTransformation = typeof transformations.$inferInsert;

export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;

export type UsageStats = typeof usageStats.$inferSelect;
export type NewUsageStats = typeof usageStats.$inferInsert;
