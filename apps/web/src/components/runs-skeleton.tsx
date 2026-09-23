export function RunsSkeleton() {
  return (
    <ul className="space-y-2" aria-busy="true" aria-label="Loading runs">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="animate-pulse rounded-lg border p-4"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-elevated)",
          }}
        >
          <div
            className="h-4 w-48 rounded"
            style={{ background: "var(--bg-soft)" }}
          />
          <div
            className="mt-3 h-3 w-full max-w-md rounded"
            style={{ background: "var(--bg-soft)" }}
          />
          <div
            className="mt-2 h-3 w-32 rounded"
            style={{ background: "var(--bg-soft)" }}
          />
        </li>
      ))}
    </ul>
  );
}
