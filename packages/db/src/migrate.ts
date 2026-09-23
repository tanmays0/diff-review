import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const url =
  process.env.DATABASE_URL ??
  "postgresql://diffreview:diffreview@localhost:5433/diffreview";

async function main() {
  const sql = postgres(url, { max: 1 });
  const dir = join(dirname(fileURLToPath(import.meta.url)), "../drizzle");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  await sql`CREATE TABLE IF NOT EXISTS drizzle_migrations (
    id text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`;

  for (const file of files) {
    const applied = await sql`
      SELECT id FROM drizzle_migrations WHERE id = ${file}
    `;
    if (applied.length > 0) continue;
    const body = readFileSync(join(dir, file), "utf8");
    const statements = body
      .split(/-->\s*statement-breakpoint/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const statement of statements) {
      await sql.unsafe(statement);
    }
    await sql`INSERT INTO drizzle_migrations (id) VALUES (${file})`;
    console.log(`Applied ${file}`);
  }

  await sql.end();
  console.log("Migrations complete");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
