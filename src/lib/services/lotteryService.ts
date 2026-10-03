import "server-only";
import { desc, eq } from "drizzle-orm";
import type { LotteryCampaign } from "@/lib/types";
import { db, schema } from "@/lib/db";
import { remember } from "./contentCache";

type Row = typeof schema.lotteryCampaigns.$inferSelect;

export function rowToCampaign(r: Row): LotteryCampaign {
  return { id: r.id, slug: r.slug, title: r.title, description: r.description, prize: r.prize, startsAt: r.startsAt?.toISOString() ?? null, endsAt: r.endsAt?.toISOString() ?? null, active: r.active };
}

/** The campaign currently accepting registrations, if any. */
export async function getActiveCampaign(): Promise<LotteryCampaign | null> {
  return remember("lottery:active", async () => {
    const d = await db();
    const rows = await d.select().from(schema.lotteryCampaigns).where(eq(schema.lotteryCampaigns.active, true)).orderBy(desc(schema.lotteryCampaigns.id)).limit(1);
    const c = rows[0] ? rowToCampaign(rows[0]) : null;
    if (!c) return null;
    const now = Date.now();
    if (c.startsAt && Date.parse(c.startsAt) > now) return null;
    if (c.endsAt && Date.parse(c.endsAt) < now) return null;
    return c;
  });
}
