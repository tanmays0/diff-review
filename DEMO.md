# Demo script (recruiters)

**Live:** https://diff-review.vercel.app *(set after deploy)*

## 5 steps

1. Open Live in **Incognito** — no SSO.
2. Click **Runs** — you should see at least one run. Badge **fixture** = seeded demo data (honest labeling). **live** = posted by the GitHub Action.
3. Open a run — read severity, category, file path, body.
4. Click **Open PR** for context. Fixture runs intentionally have **no** fake GitHub review URL. For a live comment screenshot path, add `docs/screenshots/` when available.
5. Open **Settings** — show Action secrets + workflow; narrate: `pull_request` → diff → LLM structured findings → PR review comments → `/api/ingest` → dashboard.

## Talking points

- Not “paste a diff into ChatGPT” — GitHub-native Action + persisted history.
- Shared Zod schema for findings; unmapped lines are not invented.
- Free-tier: Vercel + Postgres + Groq; heavy LLM work on GitHub runners.
