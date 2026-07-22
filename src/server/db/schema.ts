import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum, vector } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const repositoryStatusEnum = pgEnum("repository_status", ["queued", "analyzing", "ready", "failed"]);
export const analysisJobStatusEnum = pgEnum("analysis_job_status", ["queued", "running", "completed", "failed"]);
export const sourceTypeEnum = pgEnum("source_type", ["github", "zip"]);
export const fileCategoryEnum = pgEnum("file_category", ["entrypoint", "config"]);

export const repositories = pgTable("repositories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  status: repositoryStatusEnum("status").notNull().default("queued"),
  source: sourceTypeEnum("source").notNull(),
  sourceUrl: text("source_url"),
  commitSha: varchar("commit_sha", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  language: varchar("language", { length: 64 }),
  content: text("content"),
  category: fileCategoryEnum("category"),
  skipped: boolean("skipped").notNull().default(false),
  skipReason: text("skip_reason")
});

export const analysisJobs = pgTable("analysis_jobs", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  status: analysisJobStatusEnum("status").notNull().default("queued"),
  truncated: boolean("truncated").notNull().default(false),
  parsingCompletedAt: timestamp("parsing_completed_at", { withTimezone: true }),
  embeddingCompletedAt: timestamp("embedding_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const embeddingChunks = pgTable("embedding_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileId: uuid("file_id").notNull().references(() => files.id, { onDelete: "cascade" }),
  repositoryId: uuid("repository_id").notNull().references(() => repositories.id, { onDelete: "cascade" }),
  startLine: integer("start_line").notNull(),
  endLine: integer("end_line").notNull(),
  embedding: vector("embedding", { dimensions: 384 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const repositoriesRelations = relations(repositories, ({ many }) => ({
  files: many(files),
  analysisJobs: many(analysisJobs)
}));

export const filesRelations = relations(files, ({ one }) => ({
  repository: one(repositories, { fields: [files.repositoryId], references: [repositories.id] })
}));

export const analysisJobsRelations = relations(analysisJobs, ({ one }) => ({
  repository: one(repositories, { fields: [analysisJobs.repositoryId], references: [repositories.id] })
}));
