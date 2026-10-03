import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { Coupon } from "@/lib/types";
import { db, schema } from "@/lib/db";
import { remember, invalidateContent } from "./contentCache";

type CouponRow = typeof schema.coupons.$inferSelect;
type FirmRow = typeof schema.propFirms.$inferSelect;

export function rowToCoupon(c: CouponRow, f: FirmRow | null): Coupon {
  return {
    id: c.id,
    firm: f ? { id: f.id, slug: f.slug, name: f.name, logo: f.data.logo, website: f.data.website } : null,
    title: c.title,
    code: c.code,
    discountLabel: c.discountLabel,
    discountPercent: c.discountPercent,
    description: c.description,
    terms: c.terms,
    url: c.url,
    startsAt: c.startsAt?.toISOString() ?? null,
    expiresAt: c.expiresAt?.toISOString() ?? null,
    featured: c.featured,
    active: c.active,
    copyCount: c.copyCount,
  };
}

/** Active coupons that have started and not expired. */
export async function getActiveCoupons(): Promise<Coupon[]> {
  return remember("coupons:active", async () => {
    const d = await db();
    const rows = await d
      .select()
      .from(schema.coupons)
      .leftJoin(schema.propFirms, eq(schema.coupons.firmId, schema.propFirms.id))
      .where(and(eq(schema.coupons.active, true), sql`(${schema.coupons.startsAt} is null or ${schema.coupons.startsAt} <= now())`, sql`(${schema.coupons.expiresAt} is null or ${schema.coupons.expiresAt} > now())`))
      .orderBy(desc(schema.coupons.featured), asc(schema.coupons.sortOrder), desc(schema.coupons.id));
    return rows.map((r) => rowToCoupon(r.coupons, r.prop_firms));
  });
}

export async function recordCouponCopy(id: number) {
  const d = await db();
  await d.update(schema.coupons).set({ copyCount: sql`${schema.coupons.copyCount} + 1` }).where(eq(schema.coupons.id, id));
  invalidateContent("coupons:");
}
