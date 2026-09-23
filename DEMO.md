# Demo script (recruiters)

**Live:** https://diff-review-ten.vercel.app  
**Repo:** https://github.com/tanmays0/diff-review

## 5 steps

1. Open Live in **Incognito** — no SSO.
2. Click **Runs** — seeded **fixture** reviews (honest labeling) are always present for a cold demo.
3. Open a run — severity, category, file path, finding body; **Open PR** link (demo URL for fixtures).
4. **Live vs fixture:** Prefer a run with the green **live** badge (real Action → PR comments → ingest). Purple **fixture** runs are Postgres-seeded demo data (honest labels). If the DB is down, the UI falls back to in-code fixtures. After the Action runs on a PR in this repo, a **live** run appears at the top of Runs (see DEPLOY.md).
5. **Settings** — Action secrets + workflow; pipeline: Action → diff → LLM → PR comments → ingest → UI.

## Talking points

- Not “paste a diff into ChatGPT” — GitHub-native Action + persisted history.
- Shared Zod schema; unmapped lines are not invented.
- Free-tier: Vercel + Postgres + Groq; heavy LLM work on GitHub runners.
