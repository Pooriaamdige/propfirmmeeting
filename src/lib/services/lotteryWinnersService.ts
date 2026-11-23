import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export async function getPublishedLotteryWeeks() {
  const d = await db();
  return d.select({ week: schema.lotteryWeeks.week, drawnOn: schema.lotteryWeeks.drawnOn })
    .from(schema.lotteryWeeks).where(eq(schema.lotteryWeeks.published, true)).orderBy(desc(schema.lotteryWeeks.week));
}

export async function getPublishedLotteryWeek(week: number) {
  const d = await db();
  const [row] = await d.select().from(schema.lotteryWeeks)
    .where(and(eq(schema.lotteryWeeks.week, week), eq(schema.lotteryWeeks.published, true))).limit(1);
  return row ?? null;
}
