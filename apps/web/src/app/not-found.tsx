import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-3 py-16 text-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        That review run does not exist.
      </p>
      <Link href="/runs" className="text-sm" style={{ color: "var(--accent)" }}>
        Back to runs
      </Link>
    </div>
  );
}
