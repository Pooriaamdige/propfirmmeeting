/**
 * Save every table of an embedded (PGlite) database to JSON files.
 * Works on a damaged data folder as far as PostgreSQL can still read it; unreadable tables are reported.
 *
 *   npm run db:export -- [pglite-dir] [out-dir]
 *   defaults: .data/pglite → backups/db-<timestamp>
 *
 * Stop the app first (pm2 stop propfirm): only one process may open the folder.
 */
import { PGlite } from "@electric-sql/pglite";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const src = path.resolve(process.argv[2] ?? process.env.PGLITE_DIR ?? ".data/pglite");
const out = path.resolve(process.argv[3] ?? `backups/db-${new Date().toISOString().replace(/[:.]/g, "-")}`);

let pg;
try {
  pg = new PGlite(src);
  await pg.waitReady;
} catch (err) {
  console.error(`Could not open ${src}: ${err?.message ?? err}`);
  process.exit(1);
}

let tables = [];
try {
  tables = (await pg.query(`select tablename from pg_tables where schemaname = 'public' order by tablename`)).rows.map((r) => r.tablename);
} catch (err) {
  console.error(`The database can't list its tables (${err?.message ?? err}). Nothing can be recovered from this folder.`);
  process.exit(1);
}

mkdirSync(out, { recursive: true });
let ok = 0;
for (const t of tables) {
  try {
    const { rows } = await pg.query(`select * from "${t}"`);
    writeFileSync(path.join(out, `${t}.json`), JSON.stringify(rows, null, 1));
    console.log(`  ✓ ${t}: ${rows.length} rows`);
    ok++;
  } catch (err) {
    console.log(`  ✗ ${t}: ${err?.message ?? err}`);
  }
}
await pg.close().catch(() => {});
console.log(`\n${ok}/${tables.length} tables saved to ${out}`);
