# Deploy

## Prerequisites

- Vercel account (Hobby)
- **Postgres: Neon free via Vercel Marketplace (recommended)** — avoids Supabase’s free-tier **2-project limit**
- Alternative: Supabase free (only if you still have a free project slot) or Docker Compose for local
- Groq (or OpenAI) API key for the Action

> **Fixture fallback:** when `DATABASE_URL` is unset or the DB is unreachable, the Live UI still shows built-in **fixture** runs (honest `fixture` badges) so the demo URL is never empty. Seeded DB rows also use `mode=fixture` until a real Action ingest posts `mode=live`.

## Recommended free-tier path: Neon on Vercel

1. Accept Neon marketplace terms (one-time):  
   https://vercel.com/shindetanmay-gmailcoms-projects/~/integrations/accept-terms/neon?source=cli  
   (or Vercel Dashboard → Integrations → Neon → accept terms)
2. From the repo root:

```bash
cd /Users/shind/diff-review
vercel link --yes --project diff-review
vercel --non-interactive integration add neon --no-claim -n diff-review-db \
  -e production -e preview -e development
# Neon injects DATABASE_URL (and related vars) into the project
vercel env pull .env.local --yes
```

3. Confirm Vercel already has (or add):

| Env | Where | Notes |
|-----|--------|--------|
| `DATABASE_URL` | Vercel (all envs) | From Neon integration |
| `DIFF_REVIEW_INGEST_SECRET` | Vercel | Shared Bearer for `/api/ingest` |
| `NEXT_PUBLIC_APP_URL` | Vercel | `https://diff-review-ten.vercel.app` |

4. Migrate + seed (exact commands):

```bash
cd /Users/shind/diff-review
vercel env pull /tmp/diff-review.env --environment=production --yes
set -a && source /tmp/diff-review.env && set +a
pnpm db:migrate   # applies packages/db/drizzle/*.sql
pnpm db:seed      # inserts demo/diff-review-fixtures runs (mode=fixture)
rm /tmp/diff-review.env
```

5. Redeploy:

```bash
vercel --prod
```

6. Verify in **Incognito**: https://diff-review-ten.vercel.app/runs — seeded runs from Postgres (not only in-code fixtures). Ingest still authorized with `DIFF_REVIEW_INGEST_SECRET`.

## Secrets map (exact names)

| Secret | Where | Value |
|--------|--------|--------|
| `DIFF_REVIEW_INGEST_SECRET` | **Vercel** → Project → Settings → Environment Variables (Production) | Shared random secret (Bearer for `/api/ingest`) |
| `NEXT_PUBLIC_APP_URL` | **Vercel** | `https://diff-review-ten.vercel.app` |
| `DATABASE_URL` | **Vercel** (required for seeded + **live** runs on dashboard) | Neon Postgres URL (preferred). Without it, UI falls back to in-code fixtures; ingest returns 503. |
| `DIFF_REVIEW_API_URL` | **GitHub Actions** secrets | `https://diff-review-ten.vercel.app/api/ingest` |
| `DIFF_REVIEW_INGEST_SECRET` | **GitHub Actions** secrets | **Same string** as Vercel |
| `GROQ_API_KEY` | **GitHub Actions** secrets | From https://console.groq.com/keys |

Optional LLM alternatives on the Action: `openai-api-key` / `openrouter-api-key` inputs (see `action/action.yml`).

## Vercel (manual env, if not using Marketplace CLI)

```bash
cd /Users/shind/diff-review
vercel link --yes --project diff-review
vercel env add DATABASE_URL          # paste Neon connection string
vercel env add DIFF_REVIEW_INGEST_SECRET
vercel env add NEXT_PUBLIC_APP_URL   # https://diff-review-ten.vercel.app
vercel --prod
```

**Live:** https://diff-review-ten.vercel.app

Monorepo (root directory `apps/web`):

- Install: `cd ../.. && pnpm install`
- Build: `cd ../.. && pnpm --filter @diff-review/core build && pnpm --filter @diff-review/db build && pnpm --filter @diff-review/web build`

## Database

Tables: `repositories`, `review_runs`, `findings`, `diff_review_users`.

```bash
export DATABASE_URL='postgresql://…'   # or source .env.local after vercel env pull
pnpm db:migrate
pnpm db:seed
```

**Supabase note:** free accounts are limited to **2 projects**. Prefer Neon on Vercel for this portfolio app so you do not burn a Supabase slot.

Rotate `DIFF_REVIEW_INGEST_SECRET` if leaked. Never commit `.env*`.

## GitHub Action install (v1 primary)

**Consumer = this repo** (`tanmays0/diff-review`) is preferred for the proof PR.

1. Workflow path: [`.github/workflows/diff-review.yml`](./.github/workflows/diff-review.yml)  
   (source template: [`docs/action-workflow.example.yml`](./docs/action-workflow.example.yml) → copy to that path in external repos)
2. Repo → **Settings → Secrets and variables → Actions** → set the three Actions secrets above
3. Open a PR — Action posts a review and (with `DATABASE_URL`) ingests a `live` run

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

| Secret | Where | Value |
|--------|--------|--------|
| `DIFF_REVIEW_API_URL` | GitHub Actions | `https://diff-review-ten.vercel.app/api/ingest` |
| `DIFF_REVIEW_INGEST_SECRET` | GitHub Actions + Vercel | same shared secret |
| `GROQ_API_KEY` | GitHub Actions | Groq key |
| `DATABASE_URL` | Vercel only | Neon/Postgres — required for dashboard seeded + **live** runs |
