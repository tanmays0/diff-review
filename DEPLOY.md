# Deploy

## Prerequisites

- Vercel account (Hobby)
- Postgres: Neon free **or** Supabase free (Docker Compose for local)
- Groq (or OpenAI) API key for the Action

> Supabase free-project limit: demo tables can live on an existing project, or use **Neon**. The Live UI ships with built-in **fixture** runs when `DATABASE_URL` is unset so the demo URL is never empty.

## Vercel

```bash
cd /Users/shind/diff-review
vercel link --yes --project diff-review
vercel env add DATABASE_URL          # Neon/Supabase connection string
vercel env add DIFF_REVIEW_INGEST_SECRET
vercel env add NEXT_PUBLIC_APP_URL   # https://diff-review-ten.vercel.app
vercel --prod
```

**Live:** https://diff-review-ten.vercel.app

Monorepo (root directory `apps/web`):

- Install: `cd ../.. && pnpm install`
- Build: `cd ../.. && pnpm --filter @diff-review/core build && pnpm --filter @diff-review/db build && pnpm --filter @diff-review/web build`

## Database

```bash
export DATABASE_URL='postgresql://…'
pnpm db:migrate
pnpm db:seed
```

Tables: `repositories`, `review_runs`, `findings`, `diff_review_users`.

Rotate `DIFF_REVIEW_INGEST_SECRET` if leaked. Never commit `.env*`.

## GitHub Action install (v1 primary)

1. In the **consumer** repo → Settings → Secrets → Actions:
   - `DIFF_REVIEW_API_URL` = `https://diff-review-ten.vercel.app/api/ingest`
   - `DIFF_REVIEW_INGEST_SECRET` = same as Vercel
   - `GROQ_API_KEY` = Groq key
2. Copy [`docs/action-workflow.example.yml`](./action-workflow.example.yml) to `.github/workflows/diff-review.yml`
3. Open a PR — Action posts a review and ingests a `live` run

Permissions needed: `contents: read`, `pull-requests: write` (workflow already sets these).

## GitHub App install (stretch)

Not required for the recruiter demo. When creating a personal App:

1. GitHub → Settings → Developer settings → GitHub Apps → New
2. Permissions: **Contents** (Read), **Pull requests** (Read & write)
3. Subscribe to **Pull request** events
4. Generate private key; note App ID
5. Install on the demo repo; note installation ID
6. Env on the webhook host:

```
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=
GITHUB_APP_INSTALLATION_ID=
GITHUB_WEBHOOK_SECRET=
```

7. Webhook URL (future): `https://diff-review-ten.vercel.app/api/github/webhook` — **not implemented in Action-first v1**; use the Action until then.

## Action secrets summary

| Secret | Value |
|--------|--------|
| `DIFF_REVIEW_API_URL` | `https://diff-review-ten.vercel.app/api/ingest` |
| `DIFF_REVIEW_INGEST_SECRET` | same as web |
| `GROQ_API_KEY` | Groq key |
