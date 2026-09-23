import { RunsSkeleton } from "@/components/runs-skeleton";

export default function RunsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <div
          className="h-7 w-40 animate-pulse rounded"
          style={{ background: "var(--bg-soft)" }}
        />
        <div
          className="mt-2 h-4 w-64 animate-pulse rounded"
          style={{ background: "var(--bg-soft)" }}
        />
      </div>
      <RunsSkeleton />
    </div>
  );
}
