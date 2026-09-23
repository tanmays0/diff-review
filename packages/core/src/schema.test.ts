import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  anchorFindings,
  parseFindings,
  parseUnifiedDiff,
  runReviewPipeline,
  safeParseFindings,
} from "../src/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const fixtureDiff = readFileSync(join(root, "fixtures/sample.diff"), "utf8");
const fixtureFindings = JSON.parse(
  readFileSync(join(root, "fixtures/sample.findings.json"), "utf8"),
) as unknown;

describe("Finding schema", () => {
  it("accepts valid findings with body", () => {
    const findings = parseFindings(fixtureFindings);
    expect(findings).toHaveLength(2);
    expect(findings[0]?.severity).toBe("critical");
    expect(findings[0]?.category).toBe("security");
    expect(findings[0]?.message).toContain("SQL");
    expect(findings[0]?.body).toBe(findings[0]?.message);
  });

  it("accepts message + line aliases", () => {
    const findings = parseFindings([
      {
        severity: "high",
        category: "security",
        path: "src/a.ts",
        line: 10,
        message: "Use parameterized queries",
      },
    ]);
    expect(findings[0]?.startLine).toBe(10);
    expect(findings[0]?.message).toBe("Use parameterized queries");
  });

  it("rejects invalid severity", () => {
    const result = safeParseFindings([
      {
        severity: "ultra",
        category: "security",
        path: "a.ts",
        message: "x",
      },
    ]);
    expect(result.success).toBe(false);
  });

  it("rejects missing message/body", () => {
    const result = safeParseFindings([
      {
        severity: "low",
        category: "style",
        path: "a.ts",
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
        message: "not in diff",
      },
    ]);
    const parsed = parseUnifiedDiff(fixtureDiff);
    const anchored = anchorFindings(findings, parsed);
    expect(anchored[0]?.anchored).toBe(false);
    expect(anchored[0]?.startLine).toBeNull();
  });
});

describe("runReviewPipeline fixture mode", () => {
  it("no-ops GitHub posting and builds ingest payload", async () => {
    const logs: string[] = [];
    const result = await runReviewPipeline({
      mode: "fixture",
      diff: fixtureDiff,
      repository: { fullName: "demo/diff-review-fixtures" },
      prNumber: 42,
      prUrl: "https://github.com/demo/diff-review-fixtures/pull/42",
      headSha: "fixture0000001abcdef",
      findingsOverride: fixtureFindings,
      log: (m) => logs.push(m),
    });

    expect(result.mode).toBe("fixture");
    expect(result.commentsPosted).toBe(false);
    expect(result.githubReviewUrl).toBeNull();
    expect(result.ingest.mode).toBe("fixture");
    expect(result.ingest.githubReviewUrl).toBeNull();
    expect(result.ingest.findings.length).toBe(2);
    expect(result.ingest.findings[0]?.message).toBeTruthy();
    expect(result.findings.every((f) => f.anchored)).toBe(true);
    expect(logs.some((l) => l.includes("skip GitHub comments"))).toBe(true);
  });

  it("live mode requires a poster", async () => {
    await expect(
      runReviewPipeline({
        mode: "live",
        diff: fixtureDiff,
        repository: { fullName: "o/r" },
        prNumber: 1,
        prUrl: "https://github.com/o/r/pull/1",
        headSha: "abcdef0123456789",
        findingsOverride: [],
      }),
    ).rejects.toThrow(/GithubReviewPoster/);
  });

  it("live mode posts via poster", async () => {
    const post = vi.fn(async () => ({
      reviewUrl: "https://github.com/o/r/pull/1#pullrequestreview-1",
      commentUrls: [null],
    }));

    const result = await runReviewPipeline({
      mode: "live",
      diff: fixtureDiff,
      repository: { fullName: "o/r", githubRepoId: "1" },
      prNumber: 1,
      prUrl: "https://github.com/o/r/pull/1",
      headSha: "abcdef0123456789",
      findingsOverride: fixtureFindings,
      poster: { postPullRequestReview: post },
    });

    expect(post).toHaveBeenCalledOnce();
    expect(result.commentsPosted).toBe(true);
    expect(result.githubReviewUrl).toContain("pullrequestreview");
    expect(result.ingest.mode).toBe("live");
  });
});
