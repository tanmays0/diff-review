import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** Optional OAuth identities (not required for public demo). */
export const users = pgTable("diff_review_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  githubId: text("github_id").unique(),
  login: text("login").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const repositories = pgTable("repositories", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerUserId: uuid("owner_user_id"),
  fullName: text("full_name").notNull(),
  githubRepoId: text("github_repo_id"),
  isDemo: boolean("is_demo").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reviewRuns = pgTable("review_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  repositoryId: uuid("repository_id")
    .references(() => repositories.id)
    .notNull(),
  prNumber: integer("pr_number").notNull(),
  prUrl: text("pr_url").notNull(),
  headSha: text("head_sha").notNull(),
  status: text("status").notNull(),
  mode: text("mode").notNull(),
  summary: text("summary"),
  githubReviewUrl: text("github_review_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const findings = pgTable("findings", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id")
    .references(() => reviewRuns.id)
    .notNull(),
  severity: text("severity").notNull(),
  category: text("category").notNull(),
  path: text("path").notNull(),
  startLine: integer("start_line"),
  endLine: integer("end_line"),
  body: text("body").notNull(),
  githubCommentUrl: text("github_comment_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type User = typeof users.$inferSelect;
export type Repository = typeof repositories.$inferSelect;
export type ReviewRun = typeof reviewRuns.$inferSelect;
export type FindingRow = typeof findings.$inferSelect;
