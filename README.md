# diff-review

AI PR reviewer that comments on GitHub diffs (security / correctness / style) with a live dashboard for review history.

**Live:** https://diff-review-ten.vercel.app  
**Repo:** https://github.com/tanmays0/diff-review

## Recruiter demo (5 steps)

1. Open **https://diff-review-ten.vercel.app** in **Incognito** — no login wall.
2. Click **Runs** — seeded **fixture** reviews from Postgres (honest labels; in-code fallback if DB is down).
3. Open a run — severity, category, file path, finding body; **Open PR** link.
4. Prefer a green **live** badge when present (Action → PR comments → ingest). Otherwise fixtures alone still demo the product.
5. **Settings** — Action secrets + workflow; pipeline: Action → diff → LLM → PR comments → ingest → UI.

Full script: [DEMO.md](DEMO.md).

## Resume one-liner

> Built diff-review — AI PR reviewer that comments on GitHub diffs (security/correctness/style) with a live dashboard for review history.

## Architecture

```
GitHub PR → Action (Octokit + packages/core LLM)
         → Pull Request Review comments
         → POST /api/ingest → Postgres → Next.js dashboard
```

Primary: **GitHub Action**. GitHub App is stretch (see DEPLOY.md). Built-in fixtures keep the Live URL useful before Action/App install.

## Stack

- TypeScript pnpm monorepo: `apps/web`, `packages/core`, `packages/db`, `action/`
- Next.js 15 on Vercel · Postgres (Supabase/Neon) · Groq LLM · Octokit

## Local setup

```bash
pnpm install
docker compose up -d          # Postgres on :5433
cp .env.example .env.local
pnpm db:migrate && pnpm db:seed
pnpm dev                      # http://localhost:3001 (portfolio can keep :3000)
```

```bash
pnpm test
```

## GitHub Action install

1. Repo secrets: `DIFF_REVIEW_API_URL=https://diff-review-ten.vercel.app/api/ingest`, `DIFF_REVIEW_INGEST_SECRET`, `GROQ_API_KEY`
2. Add workflow from [`docs/action-workflow.example.yml`](docs/action-workflow.example.yml) or Settings page
3. Open a PR → review comments + dashboard `live` run

## GitHub App (stretch / later)

When you create the App: Contents (read), Pull requests (read/write); subscribe to `pull_request`; set `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_INSTALLATION_ID`, `GITHUB_WEBHOOK_SECRET`. Webhook handler is not in Action-first v1 — see [DEPLOY.md](DEPLOY.md).

See [DEMO.md](DEMO.md), [DEPLOY.md](DEPLOY.md), Spec Kit under [`specs/001-diff-review-product/`](specs/001-diff-review-product/).
