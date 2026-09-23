import { z } from "zod";

export const SeveritySchema = z.enum([
  "critical",
  "high",
  "medium",
  "low",
  "info",
]);

export const CategorySchema = z.enum([
  "security",
  "correctness",
  "style",
  "maintainability",
  "other",
]);

export const FindingSchema = z.object({
  severity: SeveritySchema,
  category: CategorySchema,
  path: z.string().min(1),
  startLine: z.number().int().positive().nullable().optional(),
  endLine: z.number().int().positive().nullable().optional(),
  body: z.string().min(1),
  githubCommentUrl: z.string().url().nullable().optional(),
});

export const FindingsArraySchema = z.array(FindingSchema).max(50);

export const RunStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "failed",
]);

export const RunModeSchema = z.enum(["live", "fixture"]);

export const IngestPayloadSchema = z.object({
  repository: z.object({
    fullName: z
      .string()
      .min(3)
      .regex(/^[^/]+\/[^/]+$/, "expected owner/repo"),
    githubRepoId: z.string().nullable().optional(),
  }),
  prNumber: z.number().int().positive(),
  prUrl: z.string().url(),
  headSha: z.string().min(7),
  status: RunStatusSchema,
  mode: RunModeSchema.default("live"),
  summary: z.string().nullable().optional(),
  githubReviewUrl: z.string().url().nullable().optional(),
  findings: FindingsArraySchema.default([]),
});

export type Severity = z.infer<typeof SeveritySchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Finding = z.infer<typeof FindingSchema>;
export type IngestPayload = z.infer<typeof IngestPayloadSchema>;
export type RunStatus = z.infer<typeof RunStatusSchema>;
export type RunMode = z.infer<typeof RunModeSchema>;

export function parseFindings(input: unknown): Finding[] {
  return FindingsArraySchema.parse(input);
}

export function safeParseFindings(input: unknown) {
  return FindingsArraySchema.safeParse(input);
}
