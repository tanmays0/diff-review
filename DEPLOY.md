# Deploy

## Prerequisites

- Vercel account (Hobby)
- Postgres: Neon free **or** Supabase free (Docker Compose for local)
- Groq (or OpenAI) API key for the Action

> Note: If your Supabase org is at the free-project limit, create a **Neon** database instead and set `DATABASE_URL`. The Live UI ships with built-in **fixture** runs when `DATABASE_URL` is unset so the demo URL is never empty.

## Vercel

```bash
cd apps/web
vercel link   # root directory: apps/web (or monorepo root with vercel.json)
vercel env add DATABASE_URL
vercel env add DIFF_REVIEW_INGEST_SECRET
vercel env add NEXT_PUBLIC_APP_URL
vercel --prod
```

Monorepo build (from repo root / `vercel.json`):

- Install: `pnpm install`
- Build: `pnpm --filter @diff-review/core build && pnpm --filter @diff-review/db build && pnpm --filter @diff-review/web build`
- Root directory: `apps/web`

## Database

```bash
export DATABASE_URL='postgresql://…'
pnpm db:migrate
pnpm db:seed
```

Rotate `DIFF_REVIEW_INGEST_SECRET` if leaked. Never commit `.env*`.

## Action secrets (consumer repos)

| Secret | Value |
|--------|--------|
| `DIFF_REVIEW_API_URL` | `https://<deploy>/api/ingest` |
| `DIFF_REVIEW_INGEST_SECRET` | same as Vercel |
| `GROQ_API_KEY` | Groq key |

Workflow: [`docs/action-workflow.example.yml`](./action-workflow.example.yml)
