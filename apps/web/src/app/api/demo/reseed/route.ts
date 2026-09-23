import { NextResponse } from "next/server";

/**
 * Reseed is intentionally disabled on public deploys.
 * Use `pnpm db:seed` locally / in CI with DATABASE_URL.
 */
export async function POST() {
  if (process.env.ALLOW_PUBLIC_RESEED !== "true") {
    return NextResponse.json(
      { error: "Reseed disabled. Run pnpm db:seed with DATABASE_URL." },
      { status: 403 },
    );
  }
  return NextResponse.json({ ok: true, note: "Use CLI seed script" });
}
