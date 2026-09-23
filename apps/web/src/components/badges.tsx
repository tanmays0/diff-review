import { severityColor } from "@/lib/utils";

export function ModeBadge({ mode }: { mode: string }) {
  const isLive = mode === "live";
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
      style={{
        background: isLive ? "color-mix(in srgb, var(--live) 20%, transparent)" : "color-mix(in srgb, var(--fixture) 20%, transparent)",
        color: isLive ? "var(--live)" : "var(--fixture)",
        fontFamily: "var(--font-ibm-mono), var(--font-mono)",
      }}
    >
      {mode}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const color = severityColor(severity);
  return (
    <span
      className="inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide"
      style={{
        background: `color-mix(in srgb, ${color} 18%, transparent)`,
        color,
        fontFamily: "var(--font-ibm-mono), var(--font-mono)",
      }}
    >
      {severity}
    </span>
  );
}

export function StatusDot({ status }: { status: string }) {
  const color =
    status === "completed"
      ? "var(--live)"
      : status === "failed"
        ? "var(--critical)"
        : "var(--medium)";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {status}
    </span>
  );
}
