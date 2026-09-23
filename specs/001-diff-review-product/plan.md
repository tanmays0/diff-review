# Implementation Plan: diff-review Product

**Branch**: `001-diff-review-product` | **Date**: 2026-09-23 | **Spec**: [spec.md](./spec.md)

## Summary

Ship an Action-first AI PR reviewer with a Vercel Next.js dashboard, Neon Postgres persistence, Groq LLM reviews, and Spec Kit artifacts. Primary integration is a GitHub Action (App is stretch).

## Technical Context

| Area | Choice |
|------|--------|
| Language | TypeScript (Node ≥20) |
| Monorepo | pnpm workspaces |
| UI | Next.js 15 App Router + Tailwind |
| DB | Neon Postgres + Drizzle ORM |
| GitHub | Octokit in Action; `pull_request` events |
| LLM | Groq default; OpenAI/OpenRouter via `LLM_PROVIDER` |
| Deploy | Vercel (web); GitHub-hosted runners (Action) |
| Tests | Vitest in `packages/core` |

## Constitution Check

- Structured findings schema — PASS (packages/core Zod)
- GitHub-native Action loop — PASS
- Free-tier demo + fixtures — PASS
- Honest fixture labeling — PASS
- DevTools UX (list + detail) — PASS
- Tanmay-only authorship — PASS

## Project Structure

```
apps/web/           Next.js UI + API
packages/core/      Finding schema, diff parse, review, line map
packages/db/        Drizzle schema + client
action/             GitHub Action entry
fixtures/           Sample diffs + expected shapes
specs/              Spec Kit
```

## Architecture

Action fetches PR diff → `packages/core` LLM review → GitHub PR Review comments → `POST /api/ingest` → Neon → dashboard reads via `/api/runs`.

## Complexity Tracking

No unjustified complexity. App webhook deferred to stretch.
