export type DiffHunk = {
  path: string;
  /** New-file line numbers present in the diff (added/context lines). */
  newLines: Set<number>;
  /** Map new-file line number → position in the file's patch (1-based for GitHub). */
  lineToPosition: Map<number, number>;
};

export type ParsedDiff = {
  files: DiffHunk[];
  truncated: boolean;
  rawLength: number;
};

const FILE_HEADER = /^diff --git a\/(.+) b\/(.+)$/;
const HUNK_HEADER = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

/**
 * Parse a unified diff into per-file new-line anchors for GitHub review comments.
 */
export function parseUnifiedDiff(
  diff: string,
  maxChars = 80_000,
): ParsedDiff {
  const truncated = diff.length > maxChars;
  const text = truncated ? diff.slice(0, maxChars) : diff;
  const files: DiffHunk[] = [];
  let current: DiffHunk | null = null;
  let newLine = 0;
  let position = 0;
  let inHunk = false;

  for (const line of text.split(/\r?\n/)) {
    const fileMatch = line.match(FILE_HEADER);
    if (fileMatch) {
      const path = fileMatch[2] ?? fileMatch[1] ?? "unknown";
      current = {
        path,
        newLines: new Set(),
        lineToPosition: new Map(),
      };
      files.push(current);
      position = 0;
      inHunk = false;
      continue;
    }

    if (!current) continue;

    if (line.startsWith("+++ ") || line.startsWith("--- ")) {
      continue;
    }

    const hunkMatch = line.match(HUNK_HEADER);
    if (hunkMatch) {
      newLine = Number(hunkMatch[3]);
      inHunk = true;
      position = 0;
      continue;
    }

    if (!inHunk) continue;

    if (line.startsWith("\\")) {
      // "\ No newline at end of file"
      continue;
    }

    const prefix = line[0];
    if (prefix === "+" || prefix === "-" || prefix === " " || prefix === undefined) {
      position += 1;
    }

    if (prefix === "+" || prefix === " ") {
      current.newLines.add(newLine);
      current.lineToPosition.set(newLine, position);
      newLine += 1;
    } else if (prefix === "-") {
      // deleted line — does not advance new-file line
    }
  }

  return { files, truncated, rawLength: diff.length };
}

export function findFileHunk(
  parsed: ParsedDiff,
  path: string,
): DiffHunk | undefined {
  const normalized = path.replace(/^\.\//, "");
  return (
    parsed.files.find((f) => f.path === normalized) ??
    parsed.files.find((f) => f.path.endsWith(normalized)) ??
    parsed.files.find((f) => normalized.endsWith(f.path))
  );
}

export function isLineInDiff(
  parsed: ParsedDiff,
  path: string,
  line: number | null | undefined,
): boolean {
  if (line == null) return false;
  const hunk = findFileHunk(parsed, path);
  return hunk?.newLines.has(line) ?? false;
}

export function getDiffPosition(
  parsed: ParsedDiff,
  path: string,
  line: number,
): number | null {
  const hunk = findFileHunk(parsed, path);
  return hunk?.lineToPosition.get(line) ?? null;
}
