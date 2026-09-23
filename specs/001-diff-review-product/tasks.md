# Tasks: diff-review Product

**Input**: Design documents from `/specs/001-diff-review-product/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/

## Phase 1: Setup

- [X] T001 Spec Kit constitution + feature specs
- [X] T002 Create pnpm workspace (`apps/web`, `packages/core`, `packages/db`, `action/`)
- [X] T003 [P] Docker Compose Postgres + `.env.example` + `.gitignore`
- [X] T004 Drizzle schema for users/repositories/review_runs/findings
- [X] T005 [P] Zod Finding schema + diff parser + line map in `packages/core`
- [X] T006 [P] Vitest: schema + fixture diff → findings shape
- [X] T007 LLM review module (Groq/OpenAI provider switch)
- [X] T008 Seed script for fixture demo runs
- [X] T009 Next.js pages: `/`, `/runs`, `/runs/[id]`, `/settings`
- [X] T010 API: health, runs list, run detail
- [X] T011 DevTools UI polish + light list→detail motion
- [X] T012 `POST /api/ingest` with bearer secret
- [X] T013 GitHub Action: fetch diff → review → PR comments → ingest
- [X] T014 Example workflow YAML + settings page snippet
- [X] T015 README + DEMO.md + DEPLOY.md (5-step demo)
- [X] T016 Vercel deploy + public fixture seed (Neon/Supabase when free slot available)
- [X] T017 Recruiter gate checklist verification
