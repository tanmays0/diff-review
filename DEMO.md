# Demo script (recruiters)

**Live:** https://diff-review-ten.vercel.app

## 5 steps

1. Open Live in **Incognito** — no SSO.
2. Click **Runs** — seeded **fixture** reviews (honest labeling).
3. Open a run — severity, category, file path, finding body; **Open PR** link.
4. Explain fixture vs live: live appears after GitHub Action posts a real review.
5. **Settings** — Action secrets + workflow; pipeline: Action → diff → LLM → comments → ingest → UI.

## Talking points

- Not “paste a diff into ChatGPT” — GitHub-native Action + persisted history.
- Shared Zod schema; unmapped lines are not invented.
- Free-tier: Vercel + Postgres + Groq; heavy LLM work on GitHub runners.
