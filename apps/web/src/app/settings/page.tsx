export default function SettingsPage() {
  const workflow = `name: diff-review
on:
  pull_request:
    types: [opened, synchronize, reopened]

permissions:
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: tanmays0/diff-review/action@main
        with:
          github-token: \${{ secrets.GITHUB_TOKEN }}
          api-url: \${{ secrets.DIFF_REVIEW_API_URL }}
          ingest-secret: \${{ secrets.DIFF_REVIEW_INGEST_SECRET }}
          groq-api-key: \${{ secrets.GROQ_API_KEY }}
`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Install the GitHub Action (v1). App install is documented as stretch.
          Secrets are never shown here — only names.
        </p>
      </div>

      <section
        className="space-y-3 rounded-lg border p-4"
        style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
      >
        <h2 className="text-sm font-medium">1. GitHub Action (primary)</h2>
        <ol
          className="list-decimal space-y-2 pl-5 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <li>In the target repo: Settings → Secrets and variables → Actions</li>
          <li>
            Add{" "}
            <code style={{ fontFamily: "var(--font-ibm-mono), var(--font-mono)" }}>
              DIFF_REVIEW_API_URL
            </code>
            ,{" "}
            <code style={{ fontFamily: "var(--font-ibm-mono), var(--font-mono)" }}>
              DIFF_REVIEW_INGEST_SECRET
            </code>
            ,{" "}
            <code style={{ fontFamily: "var(--font-ibm-mono), var(--font-mono)" }}>
              GROQ_API_KEY
            </code>
          </li>
          <li>
            Add{" "}
            <code style={{ fontFamily: "var(--font-ibm-mono), var(--font-mono)" }}>
              .github/workflows/diff-review.yml
            </code>{" "}
            (snippet below)
          </li>
          <li>Open a PR — comments + dashboard run appear</li>
        </ol>
      </section>

      <section
        className="space-y-3 rounded-lg border p-4"
        style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
      >
        <h2 className="text-sm font-medium">Required secrets</h2>
        <ul
          className="space-y-1 text-sm"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-ibm-mono), var(--font-mono)",
          }}
        >
          <li>DIFF_REVIEW_API_URL — https://diff-review-ten.vercel.app/api/ingest</li>
          <li>DIFF_REVIEW_INGEST_SECRET — shared with the web app</li>
          <li>GROQ_API_KEY — or OPENAI_API_KEY with LLM_PROVIDER=openai</li>
        </ul>
      </section>

      <section
        className="space-y-3 rounded-lg border p-4"
        style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
      >
        <h2 className="text-sm font-medium">Workflow snippet</h2>
        <pre
          className="overflow-x-auto rounded border p-3 text-xs leading-relaxed"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg)",
            fontFamily: "var(--font-ibm-mono), var(--font-mono)",
            color: "var(--text-muted)",
          }}
        >
          {workflow}
        </pre>
      </section>

      <section
        className="space-y-3 rounded-lg border p-4"
        style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}
      >
        <h2 className="text-sm font-medium">2. GitHub App (stretch)</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Not required for v1. When you create a personal GitHub App later:
        </p>
        <ul
          className="list-disc space-y-1 pl-5 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <li>Permissions: Contents read, Pull requests read/write</li>
          <li>Events: pull_request</li>
          <li>
            Env: GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY,
            GITHUB_APP_INSTALLATION_ID, GITHUB_WEBHOOK_SECRET
          </li>
          <li>Webhook URL → future /api/github/webhook (not shipped in Action-first v1)</li>
        </ul>
      </section>

      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Full docs: README.md and DEPLOY.md in the repository.
      </p>
    </div>
  );
}
