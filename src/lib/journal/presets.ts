import "server-only";
import { getPropFirms } from "@/lib/services/propFirmService";
import type { FirmPreset } from "@/components/journal/AccountForm";

/** Prop firm rules used to prefill a journal account's rule tracker. */
export async function firmPresets(): Promise<FirmPreset[]> {
  const firms = await getPropFirms();
  return firms.map((f) => ({ id: f.dbId!, name: f.name, daily: f.dailyDrawdown.value, max: f.maxDrawdown.value, maxType: f.maxDrawdown.type === "trailing" ? "trailing" : "static", target: f.profitTarget.phase1, minDays: f.minimumTradingDays || null }));
}
