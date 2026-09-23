import { NextResponse } from "next/server";
import { listRuns } from "@/lib/runs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? undefined;
  const repo = searchParams.get("repo") ?? undefined;

  try {
    const runs = await listRuns({ mode, repo });
    return NextResponse.json({ runs });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to list runs" },
      { status: 500 },
    );
  }
}
