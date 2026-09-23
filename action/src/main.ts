import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  runReviewPipeline,
  type GithubReviewPoster,
  type LlmProvider,
} from "@diff-review/core";

function createOctokitPoster(
  token: string,
  log: (m: string) => void,
): GithubReviewPoster {
  const octokit = github.getOctokit(token);
  return {
    async postPullRequestReview(args) {
      const review = await octokit.rest.pulls.createReview({
        owner: args.owner,
        repo: args.repo,
        pull_number: args.pullNumber,
        commit_id: args.commitId,
        event: "COMMENT",
        body: args.body,
        comments: args.comments.length > 0 ? args.comments : undefined,
      });
      const reviewUrl =
        (review.data as { html_url?: string }).html_url ??
        `https://github.com/${args.owner}/${args.repo}/pull/${args.pullNumber}#pullrequestreview-${review.data.id}`;
      log(`Posted GitHub review ${reviewUrl}`);
      return {
        reviewUrl,
        commentUrls: args.comments.map(() => null),
      };
    },
  };
}

async function ingest(
  apiUrl: string,
  secret: string,
  payload: unknown,
): Promise<string> {
  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ingest failed ${res.status}: ${text.slice(0, 400)}`);
  }
  const json = (await res.json()) as { id?: string };
  return json.id ?? "";
}

async function run(): Promise<void> {
  const token = core.getInput("github-token", { required: true });
  const apiUrl = core.getInput("api-url", { required: true });
  const ingestSecret = core.getInput("ingest-secret", { required: true });
  const provider = (core.getInput("llm-provider") || "groq") as LlmProvider;
  const model = core.getInput("llm-model") || undefined;
  const maxDiffChars = Number(core.getInput("max-diff-chars") || "80000");
  const maxFindings = Number(core.getInput("max-findings") || "20");
  const modeInput = (core.getInput("mode") || "live").toLowerCase();
  const mode = modeInput === "fixture" ? "fixture" : "live";

  const groqKey = core.getInput("groq-api-key") || process.env.GROQ_API_KEY || "";
  const openaiKey =
    core.getInput("openai-api-key") || process.env.OPENAI_API_KEY || "";
  const openrouterKey =
    core.getInput("openrouter-api-key") || process.env.OPENROUTER_API_KEY || "";

  const apiKey =
    provider === "openai"
      ? openaiKey
      : provider === "openrouter"
        ? openrouterKey
        : groqKey;

  if (!apiKey) {
    throw new Error(`Missing API key for LLM provider: ${provider}`);
  }

  const ctx = github.context;
  if (ctx.eventName !== "pull_request" && ctx.eventName !== "pull_request_target") {
    core.info(`Skipping event ${ctx.eventName}`);
    return;
  }

  const pr = ctx.payload.pull_request;
  if (!pr) {
    throw new Error("No pull_request payload");
  }

  const owner = ctx.repo.owner;
  const repo = ctx.repo.repo;
  const prNumber = pr.number;
  const headSha = pr.head.sha as string;
  const prUrl = pr.html_url as string;
  const fullName = `${owner}/${repo}`;

  const octokit = github.getOctokit(token);
  const diffRes = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner,
      repo,
      pull_number: prNumber,
      mediaType: { format: "diff" },
    },
  );

  const rawDiff =
    typeof diffRes.data === "string"
      ? diffRes.data
      : String(diffRes.data ?? "");

  if (!rawDiff.trim()) {
    core.info("Empty diff — nothing to review");
    return;
  }

  const log = (m: string) => core.info(m);
  const result = await runReviewPipeline({
    mode,
    diff: rawDiff,
    repository: {
      fullName,
      githubRepoId: String(ctx.payload.repository?.id ?? ""),
    },
    prNumber,
    prUrl,
    headSha,
    maxDiffChars,
    maxFindings,
    llm: { provider, apiKey, model },
    poster: mode === "live" ? createOctokitPoster(token, log) : undefined,
    log,
  });

  const runId = await ingest(apiUrl, ingestSecret, result.ingest);
  core.info(`Ingested run ${runId}`);
  core.setOutput("run-id", runId);
  core.setOutput("review-url", result.githubReviewUrl ?? "");
  core.setOutput("mode", mode);
}

run().catch((err) => {
  core.setFailed(err instanceof Error ? err.message : String(err));
});
