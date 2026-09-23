import { anchorFindings, truncateDiff, type AnchoredFinding } from "./anchor.js";
import { parseUnifiedDiff } from "./diff.js";
import {
  type Finding,
  type IngestPayload,
  type RunMode,
  parseFindings,
} from "./schema.js";
import {
  reviewDiff,
  summarizeFindings,
  type LlmProvider,
} from "./review.js";

export type ReviewComment = {
  path: string;
  position: number;
  body: string;
};

export type PostedReview = {
  reviewUrl: string | null;
  commentUrls: Array<string | null>;
};

/**
 * Live mode posts a GitHub PR review; fixture mode must no-op / log only.
 */
export type GithubReviewPoster = {
  postPullRequestReview(args: {
    owner: string;
    repo: string;
    pullNumber: number;
    commitId: string;
    body: string;
    comments: ReviewComment[];
  }): Promise<PostedReview>;
};

export type PipelineLogger = (message: string) => void;

export type RunPipelineInput = {
  mode: RunMode;
  diff: string;
  repository: {
    fullName: string;
    githubRepoId?: string | null;
  };
  prNumber: number;
  prUrl: string;
  headSha: string;
  maxDiffChars?: number;
  maxFindings?: number;
  /** When set, skip the LLM and use these findings (fixture / tests). */
  findingsOverride?: unknown;
  llm?: {
    provider?: LlmProvider;
    apiKey: string;
    model?: string;
  };
  poster?: GithubReviewPoster;
  log?: PipelineLogger;
};

export type RunPipelineResult = {
  mode: RunMode;
  truncated: boolean;
  findings: AnchoredFinding[];
  summary: string;
  githubReviewUrl: string | null;
  commentsPosted: boolean;
  ingest: IngestPayload;
};

function splitOwnerRepo(fullName: string): { owner: string; repo: string } {
  const [owner, repo] = fullName.split("/");
  if (!owner || !repo) {
    throw new Error(`Invalid repository fullName: ${fullName}`);
  }
  return { owner, repo };
}

function buildReviewBody(
  summary: string,
  unanchored: AnchoredFinding[],
  truncated: boolean,
  maxDiffChars: number,
): string {
  const parts = [
    "## diff-review",
    summary,
    truncated
      ? `_Diff truncated to ${maxDiffChars} characters before analysis._`
      : null,
    unanchored.length
      ? [
          "### Additional findings (not line-anchored)",
          ...unanchored.map(
            (f) =>
              `- **[${f.severity}/${f.category}]** \`${f.path}\`${
                f.startLine != null ? `:${f.startLine}` : ""
              } — ${f.message}`,
          ),
        ].join("\n")
      : null,
    "_Automated review — verify before acting._",
  ].filter(Boolean);
  return parts.join("\n\n");
}

/** Fixture / dry-run poster: logs intent, never calls GitHub. */
export function createFixturePoster(log: PipelineLogger = console.log): GithubReviewPoster {
  return {
    async postPullRequestReview(args) {
      log(
        `[fixture] skip GitHub comments for ${args.owner}/${args.repo}#${args.pullNumber} ` +
          `(${args.comments.length} inline, body ${args.body.length} chars)`,
      );
      return { reviewUrl: null, commentUrls: args.comments.map(() => null) };
    },
  };
}

/**
 * Core pipeline: ingest diff → structured findings → post (or noop) → ingest payload.
 */
export async function runReviewPipeline(
  input: RunPipelineInput,
): Promise<RunPipelineResult> {
  const log = input.log ?? console.log;
  const maxDiffChars = input.maxDiffChars ?? 80_000;
  const maxFindings = input.maxFindings ?? 20;
  const diff = truncateDiff(input.diff, maxDiffChars);
  const parsedDiff = parseUnifiedDiff(diff, maxDiffChars);

  let rawFindings: Finding[];
  if (input.findingsOverride !== undefined) {
    rawFindings = parseFindings(input.findingsOverride).slice(0, maxFindings);
    log(`[pipeline] using findingsOverride (${rawFindings.length})`);
  } else {
    if (!input.llm?.apiKey) {
      throw new Error("LLM apiKey required when findingsOverride is not set");
    }
    rawFindings = await reviewDiff({
      provider: input.llm.provider ?? "groq",
      apiKey: input.llm.apiKey,
      model: input.llm.model,
      maxFindings,
      diff,
      repoFullName: input.repository.fullName,
      prNumber: input.prNumber,
    });
  }

  const findings = anchorFindings(rawFindings, parsedDiff);
  const summary = summarizeFindings(findings);
  const inline = findings
    .filter((f) => f.anchored && f.position != null)
    .slice(0, 20)
    .map((f) => ({
      path: f.path,
      position: f.position!,
      body: `**[${f.severity}/${f.category}]** ${f.message}\n\n<sub>diff-review</sub>`,
    }));
  const unanchored = findings.filter((f) => !f.anchored || f.position == null);
  const reviewBody = buildReviewBody(
    summary,
    unanchored,
    parsedDiff.truncated,
    maxDiffChars,
  );

  const poster =
    input.mode === "fixture"
      ? createFixturePoster(log)
      : input.poster;

  if (input.mode === "live" && !poster) {
    throw new Error("live mode requires a GithubReviewPoster");
  }

  const { owner, repo } = splitOwnerRepo(input.repository.fullName);
  const posted = await poster!.postPullRequestReview({
    owner,
    repo,
    pullNumber: input.prNumber,
    commitId: input.headSha,
    body: reviewBody,
    comments: inline,
  });

  const commentsPosted =
    input.mode === "live" &&
    (inline.length > 0 || reviewBody.length > 0) &&
    posted.reviewUrl != null;

  if (input.mode === "fixture") {
    log(`[fixture] summary: ${summary}`);
  }

  const ingest: IngestPayload = {
    repository: {
      fullName: input.repository.fullName,
      githubRepoId: input.repository.githubRepoId ?? null,
    },
    prNumber: input.prNumber,
    prUrl: input.prUrl,
    headSha: input.headSha,
    status: "completed",
    mode: input.mode,
    summary:
      input.mode === "fixture"
        ? `${summary} (fixture — GitHub comments not posted)`
        : summary,
    githubReviewUrl:
      input.mode === "fixture" ? null : (posted.reviewUrl ?? null),
    findings: findings.map((f) => ({
      severity: f.severity,
      category: f.category,
      path: f.path,
      startLine: f.startLine,
      endLine: f.endLine,
      message: f.message,
      body: f.body,
      githubCommentUrl: null,
    })),
  };

  return {
    mode: input.mode,
    truncated: parsedDiff.truncated,
    findings,
    summary,
    githubReviewUrl: ingest.githubReviewUrl ?? null,
    commentsPosted,
    ingest,
  };
}
