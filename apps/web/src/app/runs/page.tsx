import Link from "next/link";
import { Suspense } from "react";
import { ModeBadge, StatusDot } from "@/components/badges";
import { RunsMotionList } from "@/components/runs-motion";
import { RunsSkeleton } from "@/components/runs-skeleton";
import { listRuns } from "@/lib/runs";
import { formatDate, severityColor } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function RunsList() {
  let runs: Awaited<ReturnType<typeof listRuns>> = [];
  let error: string | null = null;

  try {
    runs = await listRuns();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load runs";
  }

  if (error) {
    return (
      <div
        className="rounded-lg border p-4 text-sm"
        style={{ borderColor: "var(--critical)", color: "var(--critical)" }}
        role="alert"
      >
        Could not load review runs: {error}
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div
        className="rounded-lg border p-6 text-sm"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <p className="font-medium" style={{ color: "var(--text)" }}>
          No review runs yet
        </p>
        <p className="mt-2">
          Seed demo data with <code>pnpm db:seed</code>, or install the GitHub
          Action so live PR reviews appear here.
        </p>
        <Link
          href="/settings"
          className="mt-4 inline-block text-sm"
          style={{ color: "var(--accent)" }}
        >
          Action install steps →
        </Link>
      </div>
    );
  }

  return (
    <RunsMotionList>
      <ul className="space-y-2">
        {runs.map((run) => (
          <li key={run.id}>
            <Link
              href={`/runs/${run.id}`}
              className="block rounded-lg border p-4 transition-colors hover:border-[var(--border-strong)]"
              style={{
                borderColor: "var(--border)",
                background: "var(--bg-elevated)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{
                      fontFamily: "var(--font-ibm-mono), var(--font-mono)",
                    }}
                  >
                    {run.repositoryFullName}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--text-muted)" }}
                  >
                    #{run.prNumber}
                  </span>
                  <ModeBadge mode={run.mode} />
                  <StatusDot status={run.status} />
                </div>
                <span
                  className="text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {formatDate(run.createdAt)}
                </span>
              </div>
              <p
                className="mt-2 line-clamp-2 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                {run.summary ?? "No summary"}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                <span style={{ color: "var(--text-muted)" }}>
                  {run.findingCount} finding
                  {run.findingCount === 1 ? "" : "s"}
                </span>
                {Object.entries(run.severityCounts).map(([sev, n]) => (
                  <span key={sev} style={{ color: severityColor(sev) }}>
                    {n} {sev}
                  </span>
                ))}
                <span style={{ color: "var(--accent)" }}>Open →</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </RunsMotionList>
  );
}

export default function RunsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Review runs</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Persisted Action & fixture reviews. Public demo — no login required.
          </p>
        </div>
      </div>

      <Suspense fallback={<RunsSkeleton />}>
        <RunsList />
      </Suspense>
    </div>
  );
}
