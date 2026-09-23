# Data Model: diff-review

## Tables

### users (optional OAuth)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| github_id | text UK | |
| login | text | |
| created_at | timestamptz | |

### repositories

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| owner_user_id | uuid FK null | |
| full_name | text | e.g. `owner/repo` |
| github_repo_id | text null | |
| is_demo | boolean | default false |
| created_at | timestamptz | |

### review_runs

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| repository_id | uuid FK | |
| pr_number | int | |
| pr_url | text | |
| head_sha | text | |
| status | text | queued\|running\|completed\|failed |
| mode | text | live\|fixture |
| summary | text null | |
| github_review_url | text null | never set for fixture fakes |
| created_at | timestamptz | |

### findings

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| run_id | uuid FK | |
| severity | text | critical\|high\|medium\|low\|info |
| category | text | security\|correctness\|style\|maintainability\|other |
| path | text | |
| start_line | int null | |
| end_line | int null | |
| body | text | |
| github_comment_url | text null | |
| created_at | timestamptz | |

## Seed

One demo repository + ≥2 completed fixture runs with findings.
