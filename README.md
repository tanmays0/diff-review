# diff-review

AI PR reviewer that comments on GitHub diffs (security / correctness / style) with a live dashboard for review history.

| | |
|---|---|
| **Live** | https://diff-review-ten.vercel.app |
| **GitHub** | https://github.com/tanmays0/diff-review |
| **Proof PR** | https://github.com/tanmays0/diff-review/pull/1 (Action review + dashboard **live** run) |

## Resume one-liner

> Built diff-review — AI PR reviewer that comments on GitHub diffs (security/correctness/style) with a live dashboard for review history.

## Recruiter demo (≈2 min)

1. Open **Live** in **Incognito** — no login / SSO.
2. **Runs** — Postgres-seeded **fixture** reviews (honest labels). Open one: severity, category, file, message.
3. Prefer the green **live** badge (`tanmays0/diff-review#1`) — real GitHub Action → PR review → ingest. [Review on GitHub](https://github.com/tanmays0/diff-review/pull/1#pullrequestreview-5293931078).
4. **Settings** — Action secrets + workflow; pipeline below.

Full script: [DEMO.md](DEMO.md) · Deploy (Neon): [DEPLOY.md](DEPLOY.md)

## Architecture

```
GitHub PR → Action (Octokit + packages/core + Groq)
         → Pull Request Review comments
         → POST /api/ingest → Neon Postgres → Next.js dashboard
```

**Action-first.** GitHub App is stretch (see DEPLOY.md). If Postgres is down, the UI falls back to in-code fixtures with the same honest `fixture` badge.

## Stack

TypeScript pnpm monorepo · Next.js 15 (Vercel) · Neon Postgres · Groq · Octokit  
Packages: `apps/web`, `packages/core`, `packages/db`, `action/`

## GitHub Action install

1. Repo → Settings → Secrets and variables → Actions:
   - `DIFF_REVIEW_API_URL` = `https://diff-review-ten.vercel.app/api/ingest`
   - `DIFF_REVIEW_INGEST_SECRET` = same as Vercel
   - `GROQ_API_KEY` = from https://console.groq.com/keys
2. Workflow: [`.github/workflows/diff-review.yml`](.github/workflows/diff-review.yml)  
   (template: [`docs/action-workflow.example.yml`](docs/action-workflow.example.yml); external repos use `uses: tanmays0/diff-review/action@main`)
3. Open a PR → review comments + dashboard **live** run

## Local setup

```bash
pnpm install
docker compose up -d          # Postgres on :5433
cp .env.example .env.local
pnpm db:migrate && pnpm db:seed
pnpm test
pnpm dev                      # http://localhost:3001
```

Spec: [`specs/001-diff-review-product/`](specs/001-diff-review-product/)
