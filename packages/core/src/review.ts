import { FindingsArraySchema, type Finding, safeParseFindings } from "./schema.js";

export type LlmProvider = "groq" | "openai" | "openrouter";

export type ReviewOptions = {
  provider?: LlmProvider;
  apiKey: string;
  model?: string;
  maxFindings?: number;
  diff: string;
  repoFullName?: string;
  prNumber?: number;
};

const DEFAULT_MODELS: Record<LlmProvider, string> = {
  groq: "openai/gpt-oss-20b",
  openai: "gpt-4o-mini",
  openrouter: "openai/gpt-4o-mini",
};

export const REVIEW_SYSTEM_PROMPT = `You are diff-review, an AI code reviewer for GitHub pull requests.
Review the unified diff for security, correctness, style, and maintainability issues.
Return ONLY a JSON array (no markdown fences) of findings. Each finding object MUST have:
- severity: "critical" | "high" | "medium" | "low" | "info"
- category: "security" | "correctness" | "style" | "maintainability" | "other"
- path: file path from the diff
- line: number on the NEW file side (or null if unknown) — preferred field name
- startLine / endLine: optional; startLine may replace line
- message: concise actionable comment (1-3 sentences)

Rules:
- Prefer high-signal findings; skip nitpicks unless severity is info.
- Only reference lines that appear in the diff when possible.
- Cap at the requested maximum findings.
- If the diff looks safe/trivial, return [].`;

function endpoint(provider: LlmProvider): string {
  switch (provider) {
    case "groq":
      return "https://api.groq.com/openai/v1/chat/completions";
    case "openai":
      return "https://api.openai.com/v1/chat/completions";
    case "openrouter":
      return "https://openrouter.ai/api/v1/chat/completions";
    default: {
      const _exhaustive: never = provider;
      return _exhaustive;
    }
  }
}

function extractJsonArray(text: string): unknown {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fence?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("LLM response did not contain a JSON array");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as unknown;
}

async function chatComplete(
  provider: LlmProvider,
  apiKey: string,
  model: string,
  userContent: string,
): Promise<string> {
  const res = await fetch(endpoint(provider), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(provider === "openrouter"
        ? { "HTTP-Referer": "https://diff-review-ten.vercel.app" }
        : {}),
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 2048,
      ...(provider === "groq" && model.includes("gpt-oss")
        ? { reasoning_effort: "low" }
        : {}),
      messages: [
        { role: "system", content: REVIEW_SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM ${provider} error ${res.status}: ${errText.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
        reasoning?: string | null;
      };
    }>;
  };
  const message = data.choices?.[0]?.message;
  // gpt-oss on Groq may put the answer in `reasoning` with empty `content`
  const content = (message?.content ?? message?.reasoning ?? "").trim();
  if (!content) throw new Error("LLM returned empty content");
  return content;
}

function buildUserPrompt(opts: ReviewOptions): string {
  const max = opts.maxFindings ?? 20;
  const header = [
    opts.repoFullName ? `Repository: ${opts.repoFullName}` : null,
    opts.prNumber != null ? `PR: #${opts.prNumber}` : null,
    `Return at most ${max} findings as a JSON array.`,
  ]
    .filter(Boolean)
    .join("\n");

  return `${header}\n\nDIFF:\n${opts.diff}`;
}

export async function reviewDiff(opts: ReviewOptions): Promise<Finding[]> {
  const provider = opts.provider ?? "groq";
  const model = opts.model ?? DEFAULT_MODELS[provider];
  const max = opts.maxFindings ?? 20;
  const user = buildUserPrompt(opts);

  let raw = await chatComplete(provider, opts.apiKey, model, user);
  let parsed = tryParse(raw);

  if (!parsed.success) {
    raw = await chatComplete(
      provider,
      opts.apiKey,
      model,
      `${user}\n\nYour previous response was invalid JSON. Reply with ONLY a valid JSON array of findings matching the schema (severity, category, path, line, message).`,
    );
    parsed = tryParse(raw);
    if (!parsed.success) {
      throw new Error(`Failed to parse LLM findings: ${parsed.error}`);
    }
  }

  return FindingsArraySchema.parse(parsed.data.slice(0, max));
}

function tryParse(
  raw: string,
): { success: true; data: Finding[] } | { success: false; error: string } {
  try {
    const json = extractJsonArray(raw);
    const result = safeParseFindings(json);
    if (!result.success) {
      return { success: false, error: result.error.message };
    }
    return { success: true, data: result.data };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function summarizeFindings(findings: Finding[]): string {
  if (findings.length === 0) {
    return "diff-review found no issues in the reviewed diff.";
  }
  const counts = findings.reduce<Record<string, number>>((acc, f) => {
    acc[f.severity] = (acc[f.severity] ?? 0) + 1;
    return acc;
  }, {});
  const parts = Object.entries(counts)
    .map(([k, v]) => `${v} ${k}`)
    .join(", ");
  return `diff-review reported ${findings.length} finding(s): ${parts}.`;
}
