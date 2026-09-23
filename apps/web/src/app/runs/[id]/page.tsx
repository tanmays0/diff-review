import Link from "next/link";
import { notFound } from "next/navigation";
import { ModeBadge, SeverityBadge, StatusDot } from "@/components/badges";
import { RunDetailMotion } from "@/components/run-detail-motion";
import { getRun } from "@/lib/runs";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let detail: Awaited<ReturnType<typeof getRun>> = null;
  try {
    detail = await getRun(id);
  } catch {
    detail = null;
  }
  if (!detail) notFound();

  const { run, findings } = detail;

  return (
    <RunDetailMotion>
      <div className="space-y-6">
        <div>
          <Link
            href="/runs"
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            ← All runs
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-ibm-mono), var(--font-mono)" }}
            >
              {run.repositoryFullName}#{run.prNumber}
            </h1>
            <ModeBadge mode={run.mode} />
            <StatusDot status={run.status} />
          </div>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {run.summary}
          </p>
          <div
            className="mt-3 flex flex-wrap gap-4 text-xs"
            style={{ color: "var(--text-muted)", fontFamily: "var(--font-ibm-mono), var(--font-mono)" }}
          >
            <span>{formatDate(run.createdAt)}</span>
            <span>sha {run.headSha.slice(0, 7)}</span>
            <a
              href={run.prUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--accent)" }}
            >
              Open PR ↗
            </a>
            {run.githubReviewUrl ? (
              <a
                href={run.githubReviewUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--accent)" }}
              >
                GitHub review ↗
              </a>
            ) : run.mode === "fixture" ? (
              <span>Fixture — no live GitHub review URL</span>
            ) : null}
          </div>
        </div>

        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Findings ({findings.length})
          </h2>
          <ul className="space-y-2">
            {findings.map((f) => (
              <li
                key={f.id}
                className="rounded-lg border p-4"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--bg-elevated)",
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={f.severity} />
                  <span
                    className="text-xs uppercase"
                    style={{ color: "var(--text-muted)", fontFamily: "var(--font-ibm-mono), var(--font-mono)" }}
                  >
                    {f.category}
                  </span>
                  <span
                    className="text-sm"
                    style={{ fontFamily: "var(--font-ibm-mono), var(--font-mono)" }}
                  >
                    {f.path}
                    {f.startLine != null ? `:${f.startLine}` : ""}
                    {f.endLine != null && f.endLine !== f.startLine
                      ? `-${f.endLine}`
                      : ""}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{f.body}</p>
                {f.githubCommentUrl ? (
                  <a
                    href={f.githubCommentUrl}
                    className="mt-2 inline-block text-xs"
                    style={{ color: "var(--accent)" }}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View PR comment ↗
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </RunDetailMotion>
  );
}
