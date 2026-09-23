import * as core from "@actions/core";
import * as github from "@actions/github";
import {
  anchorFindings,
  parseUnifiedDiff,
  reviewDiff,
  summarizeFindings,
  truncateDiff,
  type LlmProvider,
} from "@diff-review/core";

async function run(): Promise<void> {
  const token = core.getInput("github-token", { required: true });
  const apiUrl = core.getInput("api-url", { required: true });
  const ingestSecret = core.getInput("ingest-secret", { required: true });
  const provider = (core.getInput("llm-provider") || "groq") as LlmProvider;
  const model = core.getInput("llm-model") || undefined;
  const maxDiffChars = Number(core.getInput("max-diff-chars") || "80000");
  const maxFindings = Number(core.getInput("max-findings") || "20");

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

  const diff = truncateDiff(rawDiff, maxDiffChars);
  const parsed = parseUnifiedDiff(diff, maxDiffChars);

  core.info(
    `Reviewing ${fullName}#${prNumber} (${diff.length} chars, truncated=${parsed.truncated})`,
  );

  const findings = await reviewDiff({
    provider,
    apiKey,
    model,
    maxFindings,
    diff,
    repoFullName: fullName,
    prNumber,
  });

  const anchored = anchorFindings(findings, parsed);
  const summary = summarizeFindings(anchored);

  const inline = anchored
    .filter((f) => f.anchored && f.position != null)
    .slice(0, 20)
    .map((f) => ({
      path: f.path,
      position: f.position!,
      body: `**[${f.severity}/${f.category}]** ${f.body}\n\n<sub>diff-review</sub>`,
    }));

  const bodyFindings = anchored.filter((f) => !f.anchored || f.position == null);
  const bodyParts = [
    `## diff-review`,
    summary,
    parsed.truncated
      ? `_Diff truncated to ${maxDiffChars} characters before analysis._`
      : null,
    bodyFindings.length
      ? [
          "### Additional findings (not line-anchored)",
          ...bodyFindings.map(
            (f) =>
              `- **[${f.severity}/${f.category}]** \`${f.path}\`${f.startLine != null ? `:${f.startLine}` : ""} — ${f.body}`,
          ),
        ].join("\n")
      : null,
    "_Automated review — verify before acting._",
  ].filter(Boolean);

  const review = await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    commit_id: headSha,
    event: "COMMENT",
    body: bodyParts.join("\n\n"),
    comments: inline.length > 0 ? inline : undefined,
  });

  const reviewUrl =
    (review.data as { html_url?: string }).html_url ??
    `${prUrl}#pullrequestreview-${review.data.id}`;

  const ingestBody = {
    repository: {
      fullName,
      githubRepoId: String(ctx.payload.repository?.id ?? ""),
    },
    prNumber,
    prUrl,
    headSha,
    status: "completed" as const,
    mode: "live" as const,
    summary,
    githubReviewUrl: reviewUrl,
    findings: anchored.map((f) => ({
      severity: f.severity,
      category: f.category,
      path: f.path,
      startLine: f.startLine ?? null,
      endLine: f.endLine ?? null,
      body: f.body,
      githubCommentUrl: null,
    })),
  };

  const ingestRes = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ingestSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(ingestBody),
  });

  if (!ingestRes.ok) {
    const text = await ingestRes.text();
    throw new Error(`Ingest failed ${ingestRes.status}: ${text.slice(0, 400)}`);
  }

  const ingestJson = (await ingestRes.json()) as { id?: string };
  core.info(`Ingested run ${ingestJson.id ?? "(unknown)"}`);
  core.setOutput("run-id", ingestJson.id ?? "");
  core.setOutput("review-url", reviewUrl);
}

run().catch((err) => {
  core.setFailed(err instanceof Error ? err.message : String(err));
});
