import "server-only";
import { asc, eq } from "drizzle-orm";
import type { PropFirm } from "@/lib/types";
import { db, schema } from "@/lib/db";
import { remember } from "./contentCache";
import { emptyFirm, type FirmData } from "@/lib/firm-defaults";
import { normalizePersianCopy } from "@/lib/persian-copy";

type Row = typeof schema.propFirms.$inferSelect;

/** Fills fields missing from older or hand-edited rows, so one incomplete firm can't crash a page. */
function withDefaults(data: Partial<FirmData> | null | undefined): FirmData {
  const base = emptyFirm().data;
  const d = (data ?? {}) as Partial<FirmData>;
  const merged = { ...base, ...d } as FirmData;
  for (const key of ["logo", "challengeFee", "profitTarget", "dailyDrawdown", "maxDrawdown", "profitSplit", "leverage", "payoutRules", "scalingRules", "refundPolicy"] as const) {
    merged[key] = { ...base[key], ...(d[key] ?? {}) } as never;
  }
  for (const key of ["platforms", "feeTiers", "phases", "highlights", "limitations", "faq", "sources"] as const) {
    if (!Array.isArray(d[key])) merged[key] = (key === "phases" ? [] : base[key]) as never;
  }
  for (const key of ["newsTrading", "weekendHolding", "overnightHolding", "eaAllowed", "copyTrading", "hedging", "consistencyRule", "ipRules", "vpnVps"] as const) {
    merged[key] = { ...base[key], ...(d[key] ?? {}) };
  }
  return merged;
}

export function rowToFirm(r: Row): PropFirm {
  return normalizePersianCopy({ ...withDefaults(r.data as Partial<FirmData>), id: String(r.id), dbId: r.id, slug: r.slug, name: r.name, published: r.published, featured: r.featured });
}

/** Published firms in admin-defined order. */
export async function getPropFirms(): Promise<PropFirm[]> {
  return remember("firms:published", async () => {
    const d = await db();
    const rows = await d.select().from(schema.propFirms).where(eq(schema.propFirms.published, true)).orderBy(asc(schema.propFirms.sortOrder), asc(schema.propFirms.id));
    return rows.flatMap((r) => {
      try {
        return [rowToFirm(r)];
      } catch (err) {
        console.error(`[firms] skipping firm ${r.slug}:`, err);
        return [];
      }
    });
  });
}

export async function getFeaturedPropFirms(limit = 3): Promise<PropFirm[]> {
  const all = await getPropFirms();
  const featured = all.filter((f) => f.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

export async function getPropFirm(slug: string): Promise<PropFirm | null> {
  return (await getPropFirms()).find((f) => f.slug === slug) ?? null;
}
