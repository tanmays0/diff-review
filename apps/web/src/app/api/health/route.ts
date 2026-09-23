import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "diff-review",
    time: new Date().toISOString(),
  });
}
