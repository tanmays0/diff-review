import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  anchorFindings,
  parseFindings,
  parseUnifiedDiff,
  safeParseFindings,
} from "../src/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const fixtureDiff = readFileSync(join(root, "fixtures/sample.diff"), "utf8");
const fixtureFindings = JSON.parse(
  readFileSync(join(root, "fixtures/sample.findings.json"), "utf8"),
) as unknown;

describe("Finding schema", () => {
  it("accepts valid findings", () => {
    const findings = parseFindings(fixtureFindings);
    expect(findings).toHaveLength(2);
    expect(findings[0]?.severity).toBe("critical");
    expect(findings[0]?.category).toBe("security");
  });

  it("rejects invalid severity", () => {
    const result = safeParseFindings([
      {
        severity: "ultra",
        category: "security",
        path: "a.ts",
        body: "x",
      },
    ]);
    expect(result.success).toBe(false);
  });
});

describe("diff parser + fixture → findings shape", () => {
  it("parses sample.diff new lines", () => {
    const parsed = parseUnifiedDiff(fixtureDiff);
    expect(parsed.files).toHaveLength(1);
    expect(parsed.files[0]?.path).toBe("src/auth.ts");
    expect(parsed.files[0]?.newLines.has(3)).toBe(true);
    expect(parsed.files[0]?.newLines.has(8)).toBe(true);
  });

  it("anchors fixture findings to diff lines", () => {
    const findings = parseFindings(fixtureFindings);
    const parsed = parseUnifiedDiff(fixtureDiff);
    const anchored = anchorFindings(findings, parsed);
    expect(anchored.every((f) => f.anchored)).toBe(true);
    expect(anchored[0]?.position).toBeTypeOf("number");
  });

  it("clears invented lines not in the diff", () => {
    const findings = parseFindings([
      {
        severity: "low",
        category: "style",
        path: "src/auth.ts",
        startLine: 999,
        body: "not in diff",
      },
    ]);
    const parsed = parseUnifiedDiff(fixtureDiff);
    const anchored = anchorFindings(findings, parsed);
    expect(anchored[0]?.anchored).toBe(false);
    expect(anchored[0]?.startLine).toBeNull();
  });
});
