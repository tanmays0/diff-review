import { eq } from "drizzle-orm";
import { createDb } from "./client.js";
import { findings, repositories, reviewRuns } from "./schema.js";

const url =
  process.env.DATABASE_URL ??
  "postgresql://diffreview:diffreview@localhost:5433/diffreview";

async function main() {
  const db = createDb(url);

  const existing = await db
    .select()
    .from(repositories)
    .where(eq(repositories.fullName, "demo/diff-review-fixtures"));

  let repoId = existing[0]?.id;
  if (!repoId) {
    const [repo] = await db
      .insert(repositories)
      .values({
        fullName: "demo/diff-review-fixtures",
        isDemo: true,
        githubRepoId: null,
      })
      .returning();
    repoId = repo!.id;
  } else {
    // Clear prior fixture runs for idempotent reseed
    const runs = await db
      .select()
      .from(reviewRuns)
      .where(eq(reviewRuns.repositoryId, repoId));
    for (const run of runs) {
      await db.delete(findings).where(eq(findings.runId, run.id));
      await db.delete(reviewRuns).where(eq(reviewRuns.id, run.id));
    }
  }

  const [run1] = await db
    .insert(reviewRuns)
    .values({
      repositoryId: repoId,
      prNumber: 42,
      prUrl: "https://github.com/demo/diff-review-fixtures/pull/42",
      headSha: "fixture0000001abcdef",
      status: "completed",
      mode: "fixture",
      summary:
        "diff-review reported 2 finding(s): 1 critical, 1 high. (fixture seed — not a live GitHub review)",
      githubReviewUrl: null,
    })
    .returning();

  await db.insert(findings).values([
    {
      runId: run1!.id,
      severity: "critical",
      category: "security",
      path: "src/auth.ts",
      startLine: 3,
      endLine: 4,
      body: "SQL is concatenated from user input — use parameterized queries to prevent injection.",
      githubCommentUrl: null,
    },
    {
      runId: run1!.id,
      severity: "high",
      category: "security",
      path: "src/auth.ts",
      startLine: 8,
      endLine: 8,
      body: "Exposing SECRET_API_KEY in a public config object may leak credentials to clients.",
      githubCommentUrl: null,
    },
  ]);

  const [run2] = await db
    .insert(reviewRuns)
    .values({
      repositoryId: repoId,
      prNumber: 7,
      prUrl: "https://github.com/demo/diff-review-fixtures/pull/7",
      headSha: "fixture0000002abcdef",
      status: "completed",
      mode: "fixture",
      summary: "diff-review reported 1 finding(s): 1 medium. (fixture seed)",
      githubReviewUrl: null,
    })
    .returning();

  await db.insert(findings).values([
    {
      runId: run2!.id,
      severity: "medium",
      category: "correctness",
      path: "src/cart.ts",
      startLine: 15,
      endLine: 18,
      body: "Discount is applied after tax; confirm business rules expect pre-tax discounts.",
      githubCommentUrl: null,
    },
  ]);

  console.log("Seeded fixture runs:", run1!.id, run2!.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
