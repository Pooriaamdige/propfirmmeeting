import "server-only";
import { asc, eq } from "drizzle-orm";
import type { PropFirm } from "@/lib/types";
import { db, schema } from "@/lib/db";
import { remember } from "./contentCache";

type Row = typeof schema.propFirms.$inferSelect;

export function rowToFirm(r: Row): PropFirm {
  return { ...r.data, id: String(r.id), dbId: r.id, slug: r.slug, name: r.name, published: r.published, featured: r.featured };
}

/** Published firms in admin-defined order. */
export async function getPropFirms(): Promise<PropFirm[]> {
  return remember("firms:published", async () => {
    const d = await db();
    const rows = await d.select().from(schema.propFirms).where(eq(schema.propFirms.published, true)).orderBy(asc(schema.propFirms.sortOrder), asc(schema.propFirms.id));
    return rows.map(rowToFirm);
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
