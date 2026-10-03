import "server-only";
import { db, schema } from "@/lib/db";
import { DEFAULT_SETTINGS, type SiteSettings } from "@/lib/settings-defaults";
import { remember } from "./contentCache";

export async function getSettings(): Promise<SiteSettings> {
  return remember("settings", async () => {
    try {
      const d = await db();
      const rows = await d.select().from(schema.siteSettings);
      const out = structuredClone(DEFAULT_SETTINGS) as unknown as Record<string, unknown>;
      for (const r of rows) if (r.key in out) out[r.key] = { ...(out[r.key] as object), ...(r.value as object) };
      return out as unknown as SiteSettings;
    } catch (err) {
      console.error("[settings] falling back to defaults", err);
      return DEFAULT_SETTINGS;
    }
  });
}
