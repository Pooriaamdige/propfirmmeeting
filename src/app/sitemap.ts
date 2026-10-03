import type { MetadataRoute } from "next";
import { getPropFirms } from "@/lib/services/propFirmService";
import { getArticles } from "@/lib/services/articleService";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [firms, articles] = await Promise.all([getPropFirms(), getArticles()]);
  const now = new Date();
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "hourly", priority: 1, lastModified: now },
    { url: absoluteUrl("/prop-firms/"), changeFrequency: "weekly", priority: 0.9, lastModified: now },
    { url: absoluteUrl("/compare/"), changeFrequency: "weekly", priority: 0.8, lastModified: now },
    { url: absoluteUrl("/markets/"), changeFrequency: "hourly", priority: 0.7, lastModified: now },
    { url: absoluteUrl("/news/"), changeFrequency: "hourly", priority: 0.7, lastModified: now },
    { url: absoluteUrl("/economic-calendar/"), changeFrequency: "daily", priority: 0.7, lastModified: now },
    { url: absoluteUrl("/tools/"), changeFrequency: "monthly", priority: 0.6, lastModified: now },
    { url: absoluteUrl("/blog/"), changeFrequency: "weekly", priority: 0.6, lastModified: now },
  ];
  return [
    ...staticPages,
    ...firms.map((f) => ({ url: absoluteUrl(`/prop-firms/${f.slug}/`), lastModified: new Date(f.lastReviewedAt), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...articles.map((a) => ({ url: absoluteUrl(`/blog/${a.slug}/`), lastModified: new Date(a.updatedAt), changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
