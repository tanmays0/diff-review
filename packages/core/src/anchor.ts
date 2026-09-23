import type { Finding } from "./schema.js";
import {
  getDiffPosition,
  isLineInDiff,
  type ParsedDiff,
} from "./diff.js";

export type AnchoredFinding = Finding & {
  anchored: boolean;
  /** GitHub review comment position within the patch, when available. */
  position: number | null;
};

/**
 * Attach diff anchors. Unmapped lines keep the finding but clear inventable line claims.
 */
export function anchorFindings(
  findings: Finding[],
  parsed: ParsedDiff,
): AnchoredFinding[] {
  return findings.map((f) => {
    const start = f.startLine ?? null;
    const end = f.endLine ?? start;
    const ok =
      start != null && isLineInDiff(parsed, f.path, start);
    const position =
      ok && start != null
        ? getDiffPosition(parsed, f.path, start)
        : null;

    if (ok) {
      return {
        ...f,
        startLine: start,
        endLine: end,
        anchored: true,
        position,
      };
    }

    return {
      ...f,
      startLine: null,
      endLine: null,
      anchored: false,
      position: null,
    };
  });
}

export function truncateDiff(diff: string, maxChars: number): string {
  if (diff.length <= maxChars) return diff;
  return `${diff.slice(0, maxChars)}\n\n…[diff truncated at ${maxChars} chars]`;
}
