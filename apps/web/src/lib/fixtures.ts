import type { FindingRow, ReviewRun } from "@diff-review/db";
import type { RunDetail, RunSummary } from "./runs";

const RUN_1 = "00000000-0000-4000-8000-000000000001";
const RUN_2 = "00000000-0000-4000-8000-000000000002";
const REPO = "00000000-0000-4000-8000-0000000000aa";

const now = new Date("2026-09-20T12:00:00.000Z");
const earlier = new Date("2026-09-18T09:30:00.000Z");

const fixtureRuns: Array<
  ReviewRun & { repositoryFullName: string; isDemo: boolean }
> = [
  {
    id: RUN_1,
    repositoryId: REPO,
    prNumber: 42,
    prUrl: "https://github.com/demo/diff-review-fixtures/pull/42",
    headSha: "fixture0000001abcdef",
    status: "completed",
    mode: "fixture",
    summary:
      "diff-review reported 2 finding(s): 1 critical, 1 high. (fixture seed — not a live GitHub review)",
    githubReviewUrl: null,
    createdAt: now,
    repositoryFullName: "demo/diff-review-fixtures",
    isDemo: true,
  },
  {
    id: RUN_2,
    repositoryId: REPO,
    prNumber: 7,
    prUrl: "https://github.com/demo/diff-review-fixtures/pull/7",
    headSha: "fixture0000002abcdef",
    status: "completed",
    mode: "fixture",
    summary: "diff-review reported 1 finding(s): 1 medium. (fixture seed)",
    githubReviewUrl: null,
    createdAt: earlier,
    repositoryFullName: "demo/diff-review-fixtures",
    isDemo: true,
  },
];

const fixtureFindings: Record<string, FindingRow[]> = {
  [RUN_1]: [
    {
      id: "00000000-0000-4000-8000-0000000000f1",
      runId: RUN_1,
      severity: "critical",
      category: "security",
      path: "src/auth.ts",
      startLine: 3,
      endLine: 4,
      body: "SQL is concatenated from user input — use parameterized queries to prevent injection.",
      githubCommentUrl: null,
      createdAt: now,
    },
    {
      id: "00000000-0000-4000-8000-0000000000f2",
      runId: RUN_1,
      severity: "high",
      category: "security",
      path: "src/auth.ts",
      startLine: 8,
      endLine: 8,
      body: "Exposing SECRET_API_KEY in a public config object may leak credentials to clients.",
      githubCommentUrl: null,
      createdAt: now,
    },
  ],
  [RUN_2]: [
    {
      id: "00000000-0000-4000-8000-0000000000f3",
      runId: RUN_2,
      severity: "medium",
      category: "correctness",
      path: "src/cart.ts",
      startLine: 15,
      endLine: 18,
      body: "Discount is applied after tax; confirm business rules expect pre-tax discounts.",
      githubCommentUrl: null,
      createdAt: earlier,
    },
  ],
};

export function listFixtureRuns(filters?: {
  mode?: string;
  repo?: string;
}): RunSummary[] {
  return fixtureRuns
    .filter((r) => {
      if (filters?.mode && r.mode !== filters.mode) return false;
      if (filters?.repo && r.repositoryFullName !== filters.repo) return false;
      return true;
    })
    .map((r) => {
      const fs = fixtureFindings[r.id] ?? [];
      const severityCounts: Record<string, number> = {};
      for (const f of fs) {
        severityCounts[f.severity] = (severityCounts[f.severity] ?? 0) + 1;
      }
      return {
        ...r,
        findingCount: fs.length,
        severityCounts,
      };
    });
}

export function getFixtureRun(id: string): RunDetail | null {
  const run = fixtureRuns.find((r) => r.id === id);
  if (!run) return null;
  return {
    run,
    findings: fixtureFindings[id] ?? [],
  };
}
