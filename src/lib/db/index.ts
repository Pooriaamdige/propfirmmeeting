import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

let db: NodePgDatabase<typeof schema> | null = null;

/** Returns the Drizzle client, or null when DATABASE_URL is not configured. */
export function getDb(): NodePgDatabase<typeof schema> | null {
  if (db) return db;
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  db = drizzle(new Pool({ connectionString: url, max: 5 }), { schema });
  return db;
}

export { schema };
