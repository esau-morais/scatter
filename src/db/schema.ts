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

export const versionSourceEnum = pgEnum("version_source", [
  "ai_generated",
  "manual_edit",
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
    editedAt: timestamp("edited_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("transformations_seed_id_idx").on(table.seedId)],
);

export const transformationVersions = pgTable(
  "transformation_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transformationId: uuid("transformation_id")
      .notNull()
      .references(() => transformations.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    versionNumber: integer("version_number").notNull(),
    source: versionSourceEnum("source").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("transformation_versions_transformation_id_idx").on(
      table.transformationId,
    ),
  ],
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
    // Billable usage (counts against quota)
    seedsCreated: integer("seeds_created").notNull().default(0),
    transformationsCreated: integer("transformations_created")
      .notNull()
      .default(0),
    transformationsPosted: integer("transformations_posted")
      .notNull()
      .default(0),
    // Free usage (demo content, doesn't count against quota)
    freeSeedsCreated: integer("free_seeds_created").notNull().default(0),
    freeTransformationsCreated: integer("free_transformations_created")
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
  ({ one, many }) => ({
    seed: one(seeds, {
      fields: [transformations.seedId],
      references: [seeds.id],
    }),
    versions: many(transformationVersions),
  }),
);

export const transformationVersionsRelations = relations(
  transformationVersions,
  ({ one }) => ({
    transformation: one(transformations, {
      fields: [transformationVersions.transformationId],
      references: [transformations.id],
    }),
  }),
);

export type Seed = typeof seeds.$inferSelect;
export type NewSeed = typeof seeds.$inferInsert;

export type Transformation = typeof transformations.$inferSelect;
export type NewTransformation = typeof transformations.$inferInsert;

export type TransformationVersion = typeof transformationVersions.$inferSelect;
export type NewTransformationVersion =
  typeof transformationVersions.$inferInsert;

export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;

export type UsageStats = typeof usageStats.$inferSelect;
export type NewUsageStats = typeof usageStats.$inferInsert;
