import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

export type Db = ReturnType<typeof createDb>;

export function createDb(databaseUrl: string) {
  const isNeon =
    databaseUrl.includes("neon.tech") ||
    databaseUrl.includes("sslmode=require") ||
    process.env.DATABASE_DRIVER === "neon";

  if (isNeon && !databaseUrl.includes("localhost")) {
    const sql = neon(databaseUrl);
    return drizzleNeon(sql, { schema });
  }

  const client = postgres(databaseUrl, { max: 5 });
  return drizzlePostgres(client, { schema });
}

export { schema };
