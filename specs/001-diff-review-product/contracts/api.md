# API Contracts: diff-review

## GET /api/health

`200 { "ok": true }`

## GET /api/runs

Query: `mode?=live|fixture`, `repo?=owner/name`

`200 { "runs": ReviewRunSummary[] }`

## GET /api/runs/[id]

`200 { "run": ReviewRunDetail, "findings": Finding[] }`  
`404` if missing

## POST /api/ingest

Header: `Authorization: Bearer <DIFF_REVIEW_INGEST_SECRET>`

Body:

```json
{
  "repository": { "fullName": "owner/repo", "githubRepoId": "123" },
  "prNumber": 1,
  "prUrl": "https://github.com/owner/repo/pull/1",
  "headSha": "abc",
  "status": "completed",
  "mode": "live",
  "summary": "...",
  "githubReviewUrl": "https://...",
  "findings": [
    {
      "severity": "high",
      "category": "security",
      "path": "src/a.ts",
      "startLine": 10,
      "endLine": 12,
      "body": "...",
      "githubCommentUrl": null
    }
  ]
}
```

`401` bad secret · `400` invalid body · `201 { "id": "<run-uuid>" }`
