import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  runReviewPipeline,
  type LlmProvider,
} from "@diff-review/core";
import { hasDatabase } from "@/lib/db";
import { persistIngestPayload } from "@/lib/persist-run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BodySchema = z.object({
  mode: z.enum(["fixture", "live"]).default("fixture"),
  /** Raw unified diff; if omitted in fixture mode, uses fixtures/sample.diff */
  diff: z.string().optional(),
  repository: z
    .object({
      fullName: z.string().regex(/^[^/]+\/[^/]+$/),
      githubRepoId: z.string().nullable().optional(),
    })
    .optional(),
  prNumber: z.number().int().positive().optional(),
  prUrl: z.string().url().optional(),
  headSha: z.string().min(7).optional(),
  /** Skip LLM and use provided findings (or sample findings in fixture). */
  useSampleFindings: z.boolean().optional(),
  findings: z.unknown().optional(),
  persist: z.boolean().default(true),
});

function resolveFixture(name: string): string {
  const candidates = [
    join(process.cwd(), "fixtures", name),
    join(process.cwd(), "../../fixtures", name),
    join(process.cwd(), "../../../fixtures", name),
  ];
  for (const p of candidates) {
    try {
      return readFileSync(p, "utf8");
    } catch {
      // try next
    }
  }
  throw new Error(`Fixture not found: ${name}`);
}

function loadSampleDiff(): string {
  return resolveFixture("sample.diff");
}

function loadSampleFindings(): unknown {
  return JSON.parse(resolveFixture("sample.findings.json")) as unknown;
}

/**
 * Local / demo review entrypoint.
 * - fixture: no GitHub comments (log/noop), optional persist
 * - live: requires GITHUB_TOKEN + poster via Action (this route stays fixture-first)
 */
export async function POST(request: Request) {
  const secret = process.env.DIFF_REVIEW_INGEST_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    // Allow unauthenticated fixture runs in development only
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev && (!token || token !== secret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    json = {};
  }

  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const body = parsed.data;
  const mode = body.mode;

  if (mode === "live") {
    return NextResponse.json(
      {
        error:
          "Live GitHub commenting runs in the Action. Use mode=fixture here, or trigger the Action.",
      },
      { status: 400 },
    );
  }

  const diff = body.diff ?? loadSampleDiff();
  const findingsOverride =
    body.findings ??
    (body.useSampleFindings !== false ? loadSampleFindings() : undefined);

  const llmKey =
    process.env.GROQ_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.OPENROUTER_API_KEY ||
    "";
  const provider = (process.env.LLM_PROVIDER || "groq") as LlmProvider;

  try {
    const result = await runReviewPipeline({
      mode: "fixture",
      diff,
      repository: body.repository ?? {
        fullName: "demo/diff-review-fixtures",
      },
      prNumber: body.prNumber ?? 42,
      prUrl:
        body.prUrl ?? "https://github.com/demo/diff-review-fixtures/pull/42",
      headSha: body.headSha ?? "fixture0000001abcdef",
      maxDiffChars: Number(process.env.MAX_DIFF_CHARS || "80000"),
      maxFindings: Number(process.env.MAX_FINDINGS || "20"),
      findingsOverride,
      llm:
        findingsOverride === undefined && llmKey
          ? { provider, apiKey: llmKey, model: process.env.LLM_MODEL }
          : undefined,
      log: (m) => console.info(m),
    });

    let runId: string | null = null;
    if (body.persist && hasDatabase()) {
      const saved = await persistIngestPayload(result.ingest);
      runId = saved.id;
    }

    return NextResponse.json({
      runId,
      persisted: Boolean(runId),
      mode: result.mode,
      commentsPosted: result.commentsPosted,
      githubReviewUrl: result.githubReviewUrl,
      summary: result.summary,
      findings: result.findings,
      ingest: result.ingest,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Review failed" },
      { status: 500 },
    );
  }
}
