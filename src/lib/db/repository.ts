import "server-only";
import { db, schema } from "./index";

export interface LotteryInput {
  name: string;
  email: string;
  phone: string;
  telegramId: string;
  campaignId: string;
  ipHash: string | null;
}

export type SaveResult = { ok: true } | { ok: false; reason: "duplicate" | "unavailable" };

function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}

export async function saveLotteryRegistration(input: LotteryInput): Promise<SaveResult> {
  try {
    const d = await db();
    await d.insert(schema.lotteryRegistrations).values(input);
    return { ok: true };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, reason: "duplicate" };
    console.error("[lottery] insert failed", err);
    return { ok: false, reason: "unavailable" };
  }
}

export async function saveNewsletterSubscriber(email: string): Promise<SaveResult> {
  try {
    const d = await db();
    await d.insert(schema.newsletterSubscribers).values({ email });
    return { ok: true };
  } catch (err) {
    if (isUniqueViolation(err)) return { ok: false, reason: "duplicate" };
    console.error("[newsletter] insert failed", err);
    return { ok: false, reason: "unavailable" };
  }
}
