import { test } from "node:test";
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { lotteryWeekSchema, parseLotteryWeek } from "../src/lib/lottery-winners.ts";
import { normalizePersianCopy, normalizePersianText } from "../src/lib/persian-copy.ts";

const winner = { email: "Winner@example.com", account: "$5K", firmName: "FTMO" };

test("lottery results validate and normalize all winner rows without fixing the count", () => {
  for (const count of [1, 3, 25]) {
    const parsed = lotteryWeekSchema.parse({ week: 52, drawnOn: "2026-11-23", published: true, winners: Array.from({ length: count }, (_, i) => ({ ...winner, email: ` Winner${i}@example.com ` })) });
    assert.equal(parsed.winners.length, count);
    assert.equal(parsed.winners[0].email, "winner0@example.com");
  }
});

test("empty weeks can be drafts but cannot be published", () => {
  const draft = { week: 52, drawnOn: "", published: false, winners: [] };
  assert.equal(lotteryWeekSchema.parse(draft).drawnOn, null);
  assert.equal(lotteryWeekSchema.safeParse({ ...draft, published: true }).success, false);
});

test("invalid week, date, email, account and sponsor are rejected", () => {
  const valid = { week: 52, drawnOn: "", published: true, winners: [winner] };
  for (const patch of [{ week: 0 }, { week: -1 }, { week: 1.2 }, { week: 2147483648 }, { drawnOn: "2026-02-30" }, { winners: [{ ...winner, email: "invalid" }] }, { winners: [{ ...winner, account: " " }] }, { winners: [{ ...winner, firmName: " " }] }]) {
    assert.equal(lotteryWeekSchema.safeParse({ ...valid, ...patch }).success, false, JSON.stringify(patch));
  }
});

test("week numbers are sequential and may continue beyond a calendar year's week 53", () => {
  assert.equal(lotteryWeekSchema.parse({ week: 100, drawnOn: "", published: true, winners: [winner] }).week, 100);
  for (const input of ["52", "۵۲", "٥٢", " ۵۲ "]) assert.equal(parseLotteryWeek(input), 52);
  for (const input of ["", "0", "-1", "52abc", "1.2", "1e2", "2147483648"]) assert.equal(parseLotteryWeek(input), null);
});

test("Persian sentence separators become commas while URLs, English and Markdown lists survive", () => {
  assert.equal(normalizePersianText("مقایسه کن — و ارزان‌تر بخر."), "مقایسه کن، و ارزان‌تر بخر.");
  assert.equal(normalizePersianText("نمونه - توضیح – ادامه"), "نمونه، توضیح، ادامه");
  assert.equal(normalizePersianText("قوانین\n- مورد اول\n- مورد دوم"), "قوانین\n- مورد اول\n- مورد دوم");
  assert.equal(normalizePersianText("Prop Firm — Review"), "Prop Firm — Review");
  const date = new Date();
  assert.deepEqual(normalizePersianCopy({ hero: { subtitle: "متن — ادامه" }, items: ["نمونه — توضیح"], href: "/prop-firms/", date, value: null }), { hero: { subtitle: "متن، ادامه" }, items: ["نمونه، توضیح"], href: "/prop-firms/", date, value: null });
});

test("migration is repeatable, weeks are unique, and results persist with public drafts excluded", async () => {
  const pg = new PGlite();
  try {
    const d = drizzle(pg);
    await migrate(d, { migrationsFolder: "drizzle" });
    await migrate(d, { migrationsFolder: "drizzle" });
    const winners = JSON.stringify([winner, { ...winner, email: "second@example.com", account: "$10K", firmName: "The5ers" }]);
    await pg.query("INSERT INTO lottery_weeks (week, published, winners) VALUES ($1, true, $2::jsonb), ($3, false, '[]'), ($4, true, $2::jsonb)", [52, winners, 53, 51]);
    const published = await pg.query<{ week: number; winners: typeof winner[] }>("SELECT week, winners FROM lottery_weeks WHERE published = true ORDER BY week DESC");
    assert.deepEqual(published.rows.map((r) => r.week), [52, 51]);
    assert.equal(published.rows[0].winners.length, 2);
    assert.equal(published.rows[0].winners[1].account, "$10K");
    await assert.rejects(pg.query("INSERT INTO lottery_weeks (week) VALUES (52)"), /unique constraint/);
    await pg.query("UPDATE lottery_weeks SET winners = $1::jsonb WHERE week = 52", [JSON.stringify([winner])]);
    const edited = await pg.query<{ winners: typeof winner[] }>("SELECT winners FROM lottery_weeks WHERE week = 52");
    assert.equal(edited.rows[0].winners.length, 1);
    await pg.query("DELETE FROM lottery_weeks WHERE week = 52");
    assert.equal((await pg.query("SELECT * FROM lottery_weeks WHERE week = 52")).rows.length, 0);
  } finally { await pg.close(); }
});
