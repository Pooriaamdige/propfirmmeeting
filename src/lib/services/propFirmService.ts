import type { PropFirm } from "@/lib/types";
import { propFirms } from "@/data/prop-firms";

/**
 * Prop firm repository. Components never import the dataset directly; replace this
 * implementation with a CMS/database query without touching the UI.
 */
export async function getPropFirms(): Promise<PropFirm[]> {
  return propFirms;
}

export async function getPropFirm(slug: string): Promise<PropFirm | null> {
  return propFirms.find((f) => f.slug === slug) ?? null;
}

export async function getPropFirmSlugs(): Promise<string[]> {
  return propFirms.map((f) => f.slug);
}
