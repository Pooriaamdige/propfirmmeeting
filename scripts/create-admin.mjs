// Usage: npm run admin:create -- you@example.com "strong password" [admin|editor]
// Uses DATABASE_URL if set, otherwise the embedded PGlite database in PGLITE_DIR (default ./.data/pglite).
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import path from "node:path";

const [email, password, role = "admin"] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error('Usage: npm run admin:create -- email "password (min 8 chars)" [admin|editor]');
  process.exit(1);
}
const salt = randomBytes(16);
const hash = await promisify(scrypt)(password, salt, 64, { N: 16384, r: 8, p: 1 });
const passwordHash = ["scrypt", 16384, 8, 1, salt.toString("base64url"), hash.toString("base64url")].join("$");
const sql = `insert into admin_users (email, name, password_hash, role) values ($1, $2, $3, $4)
  on conflict (email) do update set password_hash = excluded.password_hash, role = excluded.role`;
const params = [email.toLowerCase(), email.split("@")[0], passwordHash, role === "editor" ? "editor" : "admin"];

if (process.env.DATABASE_URL) {
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  await client.query(sql, params);
  await client.end();
} else {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite(path.resolve(process.env.PGLITE_DIR ?? ".data/pglite"));
  await db.query(sql, params);
  await db.close();
}
console.log(`Admin ${email} saved. (Start the app once first so the tables exist.)`);
