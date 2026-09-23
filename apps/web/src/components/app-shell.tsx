import Link from "next/link";

const links = [
  { href: "/", label: "Overview" },
  { href: "/runs", label: "Runs" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-20 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--border)",
          background: "color-mix(in srgb, var(--bg) 85%, transparent)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-baseline gap-2">
            <span
              className="text-lg font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-ibm-mono), var(--font-mono)" }}
            >
              diff-review
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              AI PR reviewer
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded px-3 py-1.5 transition-colors hover:bg-[var(--bg-soft)]"
                style={{ color: "var(--text-muted)" }}
              >
                {l.label}
              </Link>
            ))}
            <a
              href="https://github.com/tanmays0/diff-review"
              className="ml-2 rounded border px-3 py-1.5 text-xs"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      <footer
        className="mx-auto max-w-6xl border-t px-4 py-6 text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        Tanmay Shinde · portfolio DevTools · free-tier demo · fixture runs labeled honestly
      </footer>
    </div>
  );
}
