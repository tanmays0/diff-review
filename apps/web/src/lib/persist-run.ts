import { eq } from "drizzle-orm";
import type { IngestPayload } from "@diff-review/core";
import { findings, repositories, reviewRuns } from "@diff-review/db";
import { getDb, hasDatabase } from "./db";

export async function persistIngestPayload(
  payload: IngestPayload,
): Promise<{ id: string }> {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is not set");
  }

  const data = { ...payload };
  if (data.mode === "fixture") {
    data.githubReviewUrl = null;
    data.findings = data.findings.map((f) => ({
      ...f,
      githubCommentUrl: null,
    }));
  }

  const db = getDb();

  const existing = await db
    .select()
    .from(repositories)
    .where(eq(repositories.fullName, data.repository.fullName))
    .limit(1);

  let repoId = existing[0]?.id;
  if (!repoId) {
    const [repo] = await db
      .insert(repositories)
      .values({
        fullName: data.repository.fullName,
        githubRepoId: data.repository.githubRepoId ?? null,
        isDemo: data.mode === "fixture",
      })
      .returning();
    repoId = repo!.id;
  }

  const [run] = await db
    .insert(reviewRuns)
    .values({
      repositoryId: repoId,
      prNumber: data.prNumber,
      prUrl: data.prUrl,
      headSha: data.headSha,
      status: data.status,
      mode: data.mode,
      summary: data.summary ?? null,
      githubReviewUrl: data.githubReviewUrl ?? null,
    })
    .returning();

  if (data.findings.length > 0) {
    await db.insert(findings).values(
      data.findings.map((f) => ({
        runId: run!.id,
        severity: f.severity,
        category: f.category,
        path: f.path,
        startLine: f.startLine ?? null,
        endLine: f.endLine ?? null,
        body: f.message ?? f.body,
        githubCommentUrl: f.githubCommentUrl ?? null,
      })),
    );
  }

  return { id: run!.id };
}
