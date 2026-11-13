/**
 * Load tables saved by db-export.mjs into the app's current database
 * (PostgreSQL when DATABASE_URL is set, otherwise the PGlite folder).
 * The target must already exist: start the app once so it creates and migrates it, then stop it.
 * Rows in the target tables are replaced by the backup's rows; it all happens in one transaction.
 *
 *   npm run db:import -- <backup-dir>
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const dir = process.argv[2];
if (!dir || !existsSync(dir)) {
  console.error("Usage: npm run db:import -- <backup-dir>");
  process.exit(1);
}

// Parents before children, so foreign keys resolve. Sessions are skipped: everyone signs in again.
const ORDER = ["prop_firms", "articles", "coupons", "lottery_campaigns", "lottery_registrations", "newsletter_subscribers", "site_settings", "admin_users", "users", "journal_accounts", "journal_trades", "journal_transactions"];

let query, close;
if (process.env.DATABASE_URL) {
  const { default: pgPkg } = await import("pg");
  const client = new pgPkg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  query = (sql, params) => client.query(sql, params);
  close = () => client.end();
} else {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(path.resolve(process.env.PGLITE_DIR ?? ".data/pglite"));
  query = (sql, params) => db.query(sql, params);
  close = () => db.close();
}

const jsonCols = async (table) =>
  new Set((await query(`select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 and data_type in ('json', 'jsonb')`, [table])).rows.map((r) => r.column_name));

await query("begin");
try {
  for (const t of [...ORDER].reverse()) if (existsSync(path.join(dir, `${t}.json`))) await query(`delete from "${t}"`);
  for (const t of ORDER) {
    const file = path.join(dir, `${t}.json`);
    if (!existsSync(file)) {
      console.log(`  - ${t}: not in backup, left as is`);
      continue;
    }
    const rows = JSON.parse(readFileSync(file, "utf8"));
    const json = await jsonCols(t);
    for (const row of rows) {
      const cols = Object.keys(row);
      const values = cols.map((c) => (json.has(c) && row[c] !== null ? JSON.stringify(row[c]) : row[c]));
      await query(`insert into "${t}" (${cols.map((c) => `"${c}"`).join(", ")}) values (${cols.map((_, i) => `$${i + 1}`).join(", ")})`, values);
    }
    // Keep id sequences ahead of the imported ids.
    const hasId = (await query(`select 1 from information_schema.columns where table_schema = 'public' and table_name = $1 and column_name = 'id'`, [t])).rows.length > 0;
    const seq = hasId ? (await query(`select pg_get_serial_sequence($1, 'id') as s`, [`public."${t}"`])).rows[0]?.s : null;
    if (seq && rows.length) await query(`select setval($1::regclass, (select max(id) from "${t}"))`, [seq]);
    console.log(`  ✓ ${t}: ${rows.length} rows`);
  }
  await query("commit");
  console.log("\nImport finished.");
} catch (err) {
  await query("rollback").catch(() => {});
  console.error(`\nImport failed, nothing was changed: ${err?.message ?? err}`);
  process.exitCode = 1;
}
await close();
