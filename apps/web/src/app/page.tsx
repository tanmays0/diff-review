import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4 pt-4">
        <p
          className="text-xs uppercase tracking-[0.2em]"
          style={{ color: "var(--accent)", fontFamily: "var(--font-ibm-mono), var(--font-mono)" }}
        >
          DevTools · GitHub Action
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          diff-review
        </h1>
        <p className="max-w-xl text-lg" style={{ color: "var(--text-muted)" }}>
          AI PR reviewer that comments on GitHub diffs — security, correctness,
          style — with a live dashboard for review history.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/runs"
            className="rounded px-4 py-2 text-sm font-medium"
            style={{ background: "var(--accent)", color: "#041018" }}
          >
            Open review runs
          </Link>
          <Link
            href="/settings"
            className="rounded border px-4 py-2 text-sm"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            Install Action
          </Link>
        </div>
      </section>

      <section
        className="grid gap-4 sm:grid-cols-3"
        style={{ fontFamily: "var(--font-ibm-mono), var(--font-mono)" }}
      >
        {[
          {
            step: "01",
            title: "Action",
            body: "pull_request → fetch diff on GitHub-hosted runners",
          },
          {
            step: "02",
            title: "Review",
            body: "LLM → structured findings → PR review comments",
          },
          {
            step: "03",
            title: "Dashboard",
            body: "Ingest to Postgres → browse runs & findings here",
          },
        ].map((item) => (
          <div
            key={item.step}
            className="rounded-lg border p-4"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-elevated)",
            }}
          >
            <div className="text-xs" style={{ color: "var(--accent)" }}>
              {item.step}
            </div>
            <div className="mt-2 text-sm font-medium">{item.title}</div>
            <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
              {item.body}
            </p>
          </div>
        ))}
      </section>

      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Demo runs are labeled <strong style={{ color: "var(--fixture)" }}>fixture</strong> until
        a live Action posts. No SSO wall — open Runs in Incognito.
      </p>
    </div>
  );
}
