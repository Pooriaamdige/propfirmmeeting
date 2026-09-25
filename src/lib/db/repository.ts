import "server-only";
import { getDb, schema } from "./index";

export interface LotteryInput {
  name: string;
  email: string;
  phone: string;
  telegramId: string;
  campaignId: string;
  ipHash: string | null;
}

export type SaveResult = { ok: true } | { ok: false; reason: "duplicate" | "unavailable" };

// Development fallback so the forms work locally without Postgres.
// In production a missing DATABASE_URL returns "unavailable" — data is never kept only in memory.
const devLottery: LotteryInput[] = [];
const devNewsletter = new Set<string>();
const isProd = process.env.NODE_ENV === "production";

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export async function saveLotteryRegistration(input: LotteryInput): Promise<SaveResult> {
  const db = getDb();
  if (!db) {
    if (isProd) return { ok: false, reason: "unavailable" };
    if (devLottery.some((r) => r.campaignId === input.campaignId && (r.email === input.email || r.phone === input.phone))) return { ok: false, reason: "duplicate" };
    devLottery.push(input);
    console.warn("[lottery] DATABASE_URL not set — stored in memory (development only)");
    return { ok: true };
  }
  try {
    await db.insert(schema.lotteryRegistrations).values(input);
    return { ok: true };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, reason: "duplicate" };
    console.error("[lottery] insert failed", err);
    return { ok: false, reason: "unavailable" };
  }
}

export async function saveNewsletterSubscriber(email: string): Promise<SaveResult> {
  const db = getDb();
  if (!db) {
    if (isProd) return { ok: false, reason: "unavailable" };
    if (devNewsletter.has(email)) return { ok: false, reason: "duplicate" };
    devNewsletter.add(email);
    return { ok: true };
  }
  try {
    await db.insert(schema.newsletterSubscribers).values({ email });
    return { ok: true };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, reason: "duplicate" };
    console.error("[newsletter] insert failed", err);
    return { ok: false, reason: "unavailable" };
  }
}
