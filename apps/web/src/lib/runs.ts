import { desc, eq } from "drizzle-orm";
import {
  findings,
  repositories,
  reviewRuns,
  type FindingRow,
  type ReviewRun,
} from "@diff-review/db";
import { getDb, hasDatabase } from "./db";
import { getFixtureRun, listFixtureRuns } from "./fixtures";

export type RunSummary = ReviewRun & {
  repositoryFullName: string;
  findingCount: number;
  severityCounts: Record<string, number>;
};

export type RunDetail = {
  run: ReviewRun & { repositoryFullName: string; isDemo: boolean };
  findings: FindingRow[];
};

export async function listRuns(filters?: {
  mode?: string;
  repo?: string;
}): Promise<RunSummary[]> {
  if (!hasDatabase()) {
    return listFixtureRuns(filters);
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        run: reviewRuns,
        fullName: repositories.fullName,
      })
      .from(reviewRuns)
      .innerJoin(repositories, eq(reviewRuns.repositoryId, repositories.id))
      .orderBy(desc(reviewRuns.createdAt));

    const filtered = rows.filter((r) => {
      if (filters?.mode && r.run.mode !== filters.mode) return false;
      if (filters?.repo && r.fullName !== filters.repo) return false;
      return true;
    });

    const result: RunSummary[] = [];
    for (const row of filtered) {
      const fs = await db
        .select()
        .from(findings)
        .where(eq(findings.runId, row.run.id));
      const severityCounts: Record<string, number> = {};
      for (const f of fs) {
        severityCounts[f.severity] = (severityCounts[f.severity] ?? 0) + 1;
      }
      result.push({
        ...row.run,
        repositoryFullName: row.fullName,
        findingCount: fs.length,
        severityCounts,
      });
    }

    if (result.length === 0) {
      return listFixtureRuns(filters);
    }
    return result;
  } catch {
    return listFixtureRuns(filters);
  }
}

export async function getRun(id: string): Promise<RunDetail | null> {
  const fixture = getFixtureRun(id);
  if (!hasDatabase()) {
    return fixture;
  }

  try {
    const db = getDb();
    const rows = await db
      .select({
        run: reviewRuns,
        fullName: repositories.fullName,
        isDemo: repositories.isDemo,
      })
      .from(reviewRuns)
      .innerJoin(repositories, eq(reviewRuns.repositoryId, repositories.id))
      .where(eq(reviewRuns.id, id))
      .limit(1);

    const row = rows[0];
    if (!row) return fixture;

    const fs = await db
      .select()
      .from(findings)
      .where(eq(findings.runId, id));

    return {
      run: {
        ...row.run,
        repositoryFullName: row.fullName,
        isDemo: row.isDemo,
      },
      findings: fs,
    };
  } catch {
    return fixture;
  }
}
