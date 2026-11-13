import "server-only";
import path from "node:path";
import { mkdirSync } from "node:fs";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export type DB = NodePgDatabase<typeof schema>;

let ready: Promise<DB> | null = null;
// One PGlite instance per process: opening the same data folder twice corrupts it.
let pglite: unknown = null;

/**
 * Database connection, migrated and seeded on first use.
 *
 * - DATABASE_URL set → PostgreSQL via node-postgres (recommended for production).
 * - Otherwise → embedded PGlite (real Postgres compiled to WASM) persisted in
 *   PGLITE_DIR (default ./.data/pglite). Good for development and single-server installs.
 */
export function db(): Promise<DB> {
  if (!ready) {
    ready = connect().catch((err) => {
      console.error("[db] connection/migration failed:", err);
      ready = null; // retry on next call
      throw err;
    });
  }
  return ready;
}

async function connect(): Promise<DB> {
  const migrationsFolder = path.join(/*turbopackIgnore: true*/ process.cwd(), "drizzle");
  let database: DB;

  if (process.env.DATABASE_URL) {
    const [{ drizzle }, { migrate }, { Pool }] = await Promise.all([import("drizzle-orm/node-postgres"), import("drizzle-orm/node-postgres/migrator"), import("pg")]);
    database = drizzle(new Pool({ connectionString: process.env.DATABASE_URL, max: 10 }), { schema });
    await migrate(database, { migrationsFolder });
  } else {
    const [{ drizzle }, { migrate }, { PGlite }] = await Promise.all([import("drizzle-orm/pglite"), import("drizzle-orm/pglite/migrator"), import("@electric-sql/pglite")]);
    const dir = path.resolve(/*turbopackIgnore: true*/ process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pglite"));
    mkdirSync(dir, { recursive: true });
    pglite ??= new PGlite(dir);
    const pg = drizzle(pglite as InstanceType<typeof PGlite>, { schema });
    await migrate(pg, { migrationsFolder });
    database = pg as unknown as DB;
  }

  // Seeding only fills empty tables; a failure there must not take the site down.
  try {
    const { seed } = await import("./seed");
    await seed(database);
  } catch (err) {
    console.error("[db] seed failed (site continues):", err);
  }
  return database;
}

export { schema };
