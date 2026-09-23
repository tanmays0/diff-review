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

/**
 * Structured finding. Accepts `message` (preferred) or legacy `body`,
 * and `line` as an alias for `startLine`.
 */
const FindingInputSchema = z
  .object({
    severity: SeveritySchema,
    category: CategorySchema,
    path: z.string().min(1),
    line: z.number().int().positive().nullable().optional(),
    startLine: z.number().int().positive().nullable().optional(),
    endLine: z.number().int().positive().nullable().optional(),
    message: z.string().min(1).optional(),
    body: z.string().min(1).optional(),
    githubCommentUrl: z.string().url().nullable().optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.message && !val.body) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "message (or body) is required",
        path: ["message"],
      });
    }
  })
  .transform((val) => {
    const startLine = val.startLine ?? val.line ?? null;
    const endLine = val.endLine ?? startLine;
    const message = (val.message ?? val.body) as string;
    return {
      severity: val.severity,
      category: val.category,
      path: val.path,
      startLine,
      endLine,
      /** Canonical comment text (also exposed as `body` for DB/ingest). */
      message,
      body: message,
      githubCommentUrl: val.githubCommentUrl ?? null,
    };
  });

export const FindingSchema = FindingInputSchema;

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
