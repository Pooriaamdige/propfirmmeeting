import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const csvCell = (v: unknown) => {
  const s = v instanceof Date ? v.toISOString() : String(v ?? "");
  // Neutralise spreadsheet formula injection and quote everything.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};
const toCsv = (rows: Record<string, unknown>[]) => (rows.length ? [Object.keys(rows[0]).join(","), ...rows.map((r) => Object.values(r).map(csvCell).join(","))].join("\r\n") : "");

export async function GET(req: Request, ctx: RouteContext<"/admin/export/[type]">) {
  if (!(await getCurrentAdmin())) return new Response("Unauthorized", { status: 401 });
  const { type } = await ctx.params;
  const d = await db();
  let rows: Record<string, unknown>[];
  let name: string;
  if (type === "registrations") {
    const campaign = new URL(req.url).searchParams.get("campaign") ?? "";
    rows = await d
      .select({ name: schema.lotteryRegistrations.name, email: schema.lotteryRegistrations.email, phone: schema.lotteryRegistrations.phone, telegram_id: schema.lotteryRegistrations.telegramId, campaign_id: schema.lotteryRegistrations.campaignId, created_at: schema.lotteryRegistrations.createdAt })
      .from(schema.lotteryRegistrations)
      .where(eq(schema.lotteryRegistrations.campaignId, campaign))
      .orderBy(desc(schema.lotteryRegistrations.createdAt));
    name = `lottery-${campaign}`;
  } else if (type === "subscribers") {
    rows = await d.select({ email: schema.newsletterSubscribers.email, source: schema.newsletterSubscribers.source, created_at: schema.newsletterSubscribers.createdAt }).from(schema.newsletterSubscribers).orderBy(desc(schema.newsletterSubscribers.createdAt));
    name = "newsletter";
  } else return new Response("Not found", { status: 404 });

  // BOM so Excel opens UTF-8 Persian text correctly.
  return new Response("﻿" + toCsv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
