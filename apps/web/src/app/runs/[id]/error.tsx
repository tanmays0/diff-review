"use client";

import Link from "next/link";

export default function RunDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4 py-10">
      <h1 className="text-xl font-semibold" style={{ color: "var(--critical)" }}>
        Failed to load run
      </h1>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {error.message || "Unexpected error"}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded px-3 py-1.5 text-sm"
          style={{ background: "var(--accent)", color: "#041018" }}
        >
          Retry
        </button>
        <Link
          href="/runs"
          className="rounded border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          All runs
        </Link>
      </div>
    </div>
  );
}
