# Feature Specification: diff-review Product

**Feature Branch**: `001-diff-review-product`

**Created**: 2026-09-23

**Status**: Active

**Input**: User description: "AI PR reviewer / Action that reviews GitHub diffs (security/correctness/style), posts PR comments, persists runs in Postgres, and ships a live dashboard for review history."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse review history (Priority: P1)

A recruiter opens the live dashboard without signing in and sees past review runs (seeded fixtures and/or live). They open a run and inspect findings with severity, file path, and optional line.

**Why this priority**: Recruiter gate — Live URL must not be empty or SSO-walled.

**Independent Test**: Incognito → `/runs` → open a run → see findings with severity + file.

**Acceptance Scenarios**:

1. **Given** seeded demo data, **When** visiting `/runs` without auth, **Then** at least one completed run is listed with mode badge (`fixture` or `live`).
2. **Given** a run with findings, **When** opening `/runs/[id]`, **Then** findings show severity, category, path, body, and PR link when available.

---

### User Story 2 - Action reviews a PR (Priority: P1)

A developer adds the diff-review Action to a repo. On `pull_request` opened/synchronize, the Action fetches the diff, runs the LLM review pipeline, posts a PR review with structured comments, and ingests the run into the dashboard API.

**Why this priority**: Proves this is not “paste a diff into ChatGPT.”

**Independent Test**: Open a PR on a demo repo with the Action → see GitHub review comments → matching run appears in `/runs`.

**Acceptance Scenarios**:

1. **Given** Action secrets configured, **When** a PR is opened or updated, **Then** a GitHub Pull Request Review is created with inline and/or body comments.
2. **Given** a successful review, **When** ingest succeeds, **Then** a `live` run with findings is queryable via `GET /api/runs`.

---

### User Story 3 - Install & settings docs (Priority: P2)

A developer visits `/settings` (or README) and copies the Action workflow YAML plus required secrets checklist.

**Why this priority**: Enables third-party install without chatting with the author.

**Independent Test**: Open `/settings` → see workflow snippet and env var names (no secret values).

**Acceptance Scenarios**:

1. **Given** the live site, **When** visiting `/settings`, **Then** Action install steps and secret names are visible.

---

### User Story 4 - Fixture honesty (Priority: P2)

Fixture/seeded runs never claim fake GitHub comment URLs. Live runs may link to real PR comments.

**Why this priority**: Constitution principle IV.

**Independent Test**: Open a `fixture` run — no fabricated comment URL; optional DEMO.md screenshot note if no live PR yet.

### Edge Cases

- Huge diffs → truncate with documented budget; still produce findings or fail with clear status.
- LLM returns invalid JSON → one repair attempt, then run `failed`.
- Unmapped line numbers → finding kept as body-only / unanchored, never invent lines.
- Missing ingest secret → Action fails loudly; UI still shows fixtures.
- Neon cold start → health endpoint + friendly empty/loading states.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a GitHub Action that triggers on `pull_request` (`opened`, `synchronize`, `reopened`).
- **FR-002**: System MUST produce structured findings (severity, path, optional lines, category, body) validated by a shared schema.
- **FR-003**: System MUST post a GitHub Pull Request Review (inline comments when line-mapped).
- **FR-004**: System MUST persist repositories, runs, and findings in Postgres.
- **FR-005**: System MUST expose a public Next.js UI: `/`, `/runs`, `/runs/[id]`, `/settings`.
- **FR-006**: System MUST seed fixture runs so the Live URL is useful before Action install.
- **FR-007**: System MUST accept authenticated ingest via `POST /api/ingest` with a shared secret.
- **FR-008**: System MUST label runs as `live` or `fixture` and never fake GitHub comment URLs for fixtures.
- **FR-009**: System MUST provide Docker Compose for local Postgres and README/DEMO/DEPLOY docs.
- **FR-010**: System MUST ship Vitest (or equivalent) tests for finding schema + fixture parsing.

### Key Entities

- **User**: optional GitHub identity (OAuth stretch); not required for demo browse.
- **Repository**: `full_name`, optional GitHub id, `is_demo` flag.
- **ReviewRun**: PR metadata, status, mode, summary, optional GitHub review URL.
- **Finding**: severity, category, path, lines, body, optional comment URL.

## Success Criteria *(mandatory)*

- **SC-001**: Live URL opens in Incognito without SSO and shows ≥1 run.
- **SC-002**: Run detail shows severity + file for each finding.
- **SC-003**: README includes Live URL, architecture, Action setup, and a 5-step demo script.
- **SC-004**: Schema/parser tests pass in CI or local `pnpm test`.
- **SC-005**: At least one live Action-reviewed PR is preferred before calling Done (fixture-only acceptable interim with DEMO.md note).
