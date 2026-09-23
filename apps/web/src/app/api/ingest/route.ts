import { NextResponse } from "next/server";
import { IngestPayloadSchema } from "@diff-review/core";
import { hasDatabase } from "@/lib/db";
import { persistIngestPayload } from "@/lib/persist-run";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const secret = process.env.DIFF_REVIEW_INGEST_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Ingest not configured" },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token !== secret) {
    return unauthorized();
  }

  if (!hasDatabase()) {
    return NextResponse.json(
      {
        error:
          "DATABASE_URL not set — persist disabled. Set Postgres URL and migrate/seed.",
      },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = IngestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const { id } = await persistIngestPayload(parsed.data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ingest failed" },
      { status: 500 },
    );
  }
}
