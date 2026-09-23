# diff-review

AI PR reviewer that comments on GitHub diffs (security / correctness / style) with a live dashboard for review history.

**Live:** https://diff-review-ten.vercel.app  
**Repo:** https://github.com/tanmays0/diff-review

## Recruiter demo (5 steps)

1. Open the **Live** URL in Incognito — no login wall.
2. Go to **Runs** — see seeded **fixture** reviews (and any **live** Action runs).
3. Open a run — inspect severity, category, file path, and finding body.
4. If a **live** run exists, click **Open PR** / **GitHub review**; otherwise see `DEMO.md` for the fixture note.
5. Skim **Settings** for Action install secrets + workflow snippet; explain pipeline: Action → diff → LLM → PR comments → ingest → UI.

## Architecture

```
GitHub PR → Action (Octokit + packages/core LLM)
         → Pull Request Review comments
         → POST /api/ingest → Postgres → Next.js dashboard
```

Primary integration: **GitHub Action** (App is stretch). Fixture seeds keep the Live URL useful before Action install.

## Stack

- TypeScript pnpm monorepo: `apps/web`, `packages/core`, `packages/db`, `action/`
- Next.js 15 on Vercel · Postgres (Supabase/Neon) · Groq LLM · Octokit

## Local setup

```bash
pnpm install
docker compose up -d
cp .env.example .env.local
# set DATABASE_URL=postgresql://diffreview:diffreview@localhost:5433/diffreview
pnpm db:migrate && pnpm db:seed
pnpm dev
```

Tests:

```bash
pnpm test
```

## Action install

1. Add secrets: `DIFF_REVIEW_API_URL`, `DIFF_REVIEW_INGEST_SECRET`, `GROQ_API_KEY`
2. Copy workflow from [`docs/action-workflow.example.yml`](docs/action-workflow.example.yml) (or Settings page)
3. Open a PR — review comments + dashboard run appear

See [DEPLOY.md](DEPLOY.md) and [DEMO.md](DEMO.md). Spec Kit: [`specs/001-diff-review-product/`](specs/001-diff-review-product/).

## Resume line

> Built diff-review — AI PR reviewer that comments on GitHub diffs (security/correctness/style) with a live dashboard for review history.
