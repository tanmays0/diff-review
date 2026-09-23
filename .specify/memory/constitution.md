# diff-review Constitution

## Core Principles

### I. Structured Reviews Over Chat Paste (NON-NEGOTIABLE)

Every review finding MUST be schema-valid: severity, path, optional line(s), category, and body.
Unstructured LLM blobs are not the product. Invalid JSON MUST be rejected or repaired once, then fail clearly.

### II. GitHub-Native Loop

The core loop is Action → diff → LLM → PR comments → persisted run → dashboard.
A UI without GitHub integration (or an honest fixture mode) is incomplete for v1.

### III. Free-Tier Demoability

Hobby hosting only: Vercel + Neon Postgres + Groq (or OpenAI/OpenRouter via env).
Public Live URL MUST show seeded review runs without requiring SSO.
Secrets never committed. Git author is Tanmay Shinde only — no Cursor co-author trailers.

### IV. Honest Fixture Labeling

Every run is `live` or `fixture`. Never invent a GitHub comment URL for fixture data.
The dashboard MUST make mode visible so recruiters are not misled.

### V. DevTools UX

Ship a dense, crisp product shell (runs list + run detail), dark-friendly OK.
Avoid purple AI landing fluff. Light motion only (list → detail). Cite-rag owns flagship polish budget.

## Constraints

- Stack locked for v1: TypeScript pnpm monorepo, Next.js App Router, Neon Postgres + Drizzle,
  GitHub Action + Octokit (App is stretch), Groq-default LLM, Docker Compose for local Postgres.
- Out of scope v1: auto-merge, IDE extension, multi-LLM marketplace, GitHub App Marketplace,
  Strix scans of customer repos without consent, replacing GitHub’s native review UI.
- Incognito visitors MUST browse demo/seeded runs without auth. OAuth is optional and non-gating.

## Development Workflow

1. Spec Kit first: constitution → specify → plan → tasks → implement → converge.
2. Tests required for finding schema and fixture diff → findings shape (`packages/core`).
3. Public HTTPS demo required before calling the project done.
4. No Strix unless explicitly requested.

## Governance

This constitution supersedes informal preferences when they conflict.
Amendments require updating this file and noting the date.
All implementation plans and PRs must pass the Constitution Check gates.

**Version**: 1.0.0 | **Ratified**: 2026-09-23 | **Last Amended**: 2026-09-23
