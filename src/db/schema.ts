import { boolean, date, integer, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const dailyBuckets = pgTable("daily_buckets", {
  id: uuid("id").defaultRandom().primaryKey(), date: date("date").notNull(), name: text("name").notNull(), position: integer("position").notNull(), persistent: boolean("persistent").notNull().default(false), endsBefore: date("ends_before"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const bucketExclusions = pgTable("bucket_exclusions", {
  bucketId: uuid("bucket_id").notNull().references(() => dailyBuckets.id, { onDelete: "cascade" }), date: date("date").notNull(),
}, (table) => [primaryKey({ columns: [table.bucketId, table.date] })]);
export const todos = pgTable("todos", {
  id: uuid("id").defaultRandom().primaryKey(), title: text("title").notNull(), scheduledFor: date("scheduled_for"), bucketId: uuid("bucket_id").references(() => dailyBuckets.id, { onDelete: "set null" }), position: integer("position").notNull().default(0), completed: boolean("completed").notNull().default(false), detailsMarkdown: text("details_markdown").notNull().default(""), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), completedAt: timestamp("completed_at", { withTimezone: true }),
});
export const dailyReviews = pgTable("daily_reviews", { id: uuid("id").defaultRandom().primaryKey(), reviewDate: date("review_date").notNull().unique(), previousDate: date("previous_date").notNull(), reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull().defaultNow() });
export const attachments = pgTable("attachments", { id: uuid("id").defaultRandom().primaryKey(), todoId: uuid("todo_id").notNull().references(() => todos.id, { onDelete: "cascade" }), name: text("name").notNull(), mimeType: text("mime_type").notNull(), sizeBytes: integer("size_bytes").notNull(), storageKey: text("storage_key").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow() });
