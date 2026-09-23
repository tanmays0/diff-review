import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { IngestPayloadSchema } from "@diff-review/core";
import { findings, repositories, reviewRuns } from "@diff-review/db";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const secret = process.env.DIFF_REVIEW_INGEST_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Ingest not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token !== secret) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = IngestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  // Honest fixture rule: never accept fake review URLs on fixture mode from clients
  // claiming live URLs is fine; fixture must not invent comment URLs that look real
  // without being live — we allow null only for fixture githubReviewUrl overrides.
  if (payload.mode === "fixture") {
    payload.githubReviewUrl = null;
    for (const f of payload.findings) {
      f.githubCommentUrl = null;
    }
  }

  try {
    const db = getDb();

    const existing = await db
      .select()
      .from(repositories)
      .where(eq(repositories.fullName, payload.repository.fullName))
      .limit(1);

    let repoId = existing[0]?.id;
    if (!repoId) {
      const [repo] = await db
        .insert(repositories)
        .values({
          fullName: payload.repository.fullName,
          githubRepoId: payload.repository.githubRepoId ?? null,
          isDemo: false,
        })
        .returning();
      repoId = repo!.id;
    }

    const [run] = await db
      .insert(reviewRuns)
      .values({
        repositoryId: repoId,
        prNumber: payload.prNumber,
        prUrl: payload.prUrl,
        headSha: payload.headSha,
        status: payload.status,
        mode: payload.mode,
        summary: payload.summary ?? null,
        githubReviewUrl: payload.githubReviewUrl ?? null,
      })
      .returning();

    if (payload.findings.length > 0) {
      await db.insert(findings).values(
        payload.findings.map((f) => ({
          runId: run!.id,
          severity: f.severity,
          category: f.category,
          path: f.path,
          startLine: f.startLine ?? null,
          endLine: f.endLine ?? null,
          body: f.body,
          githubCommentUrl: f.githubCommentUrl ?? null,
        })),
      );
    }

    return NextResponse.json({ id: run!.id }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ingest failed" },
      { status: 500 },
    );
  }
}
