# Tasks: diff-review Product

**Input**: Design documents from `/specs/001-diff-review-product/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/

## Phase 1: Setup

- [X] T001 Spec Kit constitution + feature specs
- [ ] T002 Create pnpm workspace (`apps/web`, `packages/core`, `packages/db`, `action/`)
- [ ] T003 [P] Docker Compose Postgres + `.env.example` + `.gitignore`

## Phase 2: Foundational

- [ ] T004 Drizzle schema for users/repositories/review_runs/findings
- [ ] T005 [P] Zod Finding schema + diff parser + line map in `packages/core`
- [ ] T006 [P] Vitest: schema + fixture diff → findings shape
- [ ] T007 LLM review module (Groq/OpenAI provider switch)
- [ ] T008 Seed script for fixture demo runs

## Phase 3: Dashboard (US1)

- [ ] T009 Next.js pages: `/`, `/runs`, `/runs/[id]`, `/settings`
- [ ] T010 API: health, runs list, run detail
- [ ] T011 DevTools UI polish + light list→detail motion

## Phase 4: Action + ingest (US2)

- [ ] T012 `POST /api/ingest` with bearer secret
- [ ] T013 GitHub Action: fetch diff → review → PR comments → ingest
- [ ] T014 Example workflow YAML + settings page snippet

## Phase 5: Deploy & docs

- [ ] T015 README + DEMO.md + DEPLOY.md (5-step demo)
- [ ] T016 Vercel deploy + Neon + public seed
- [ ] T017 Recruiter gate checklist verification
