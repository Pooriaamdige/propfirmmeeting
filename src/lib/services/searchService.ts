import "server-only";
import { getPropFirms } from "./propFirmService";
import { getArticles } from "./articleService";
import { getEconomicCalendar } from "./economicCalendarService";
import { SYMBOLS } from "@/lib/symbols";
import { articleCategories } from "@/data/articles";

export type SearchKind = "prop-firm" | "article" | "market" | "news" | "page";
export interface SearchResult {
  kind: SearchKind;
  title: string;
  subtitle: string;
  href: string;
}

const PAGES: SearchResult[] = [
  { kind: "page", title: "مقایسه پراپ‌فرم‌ها", subtitle: "Compare", href: "/compare/" },
  { kind: "page", title: "تقویم اقتصادی", subtitle: "Economic Calendar", href: "/economic-calendar/" },
  { kind: "page", title: "محاسبه‌گر پراپ و حجم معامله", subtitle: "Position Size Calculator", href: "/tools/#position-size" },
  { kind: "page", title: "محاسبه‌گر دراداون", subtitle: "Drawdown Calculator", href: "/tools/#drawdown" },
  { kind: "page", title: "اخبار مهم بازار", subtitle: "Forex Factory News", href: "/news/" },
  { kind: "page", title: "بازارهای جهانی و نمودار", subtitle: "Markets", href: "/markets/" },
];

const norm = (s: string) => s.toLowerCase().replace(/[‌\s/_-]+/g, "").replace(/ي/g, "ی").replace(/ك/g, "ک");

export async function search(query: string): Promise<SearchResult[]> {
  const q = norm(query);
  const [firms, articles] = await Promise.all([getPropFirms(), getArticles()]);

  const all: SearchResult[] = [
    ...firms.map((f) => ({ kind: "prop-firm" as const, title: f.name, subtitle: `${f.program} · ${f.country ?? ""}`, href: `/prop-firms/${f.slug}/` })),
    ...articles.map((a) => ({ kind: "article" as const, title: a.title, subtitle: articleCategories.find((c) => c.id === a.category)?.label ?? "", href: `/blog/${a.slug}/` })),
    ...Object.values(SYMBOLS).map((s) => ({ kind: "market" as const, title: s.code, subtitle: s.faName, href: `/markets/?symbol=${s.code}` })),
    ...PAGES,
  ];

  if (!q) return all.filter((r) => r.kind === "prop-firm" || r.kind === "page").slice(0, 10);

  let news: SearchResult[] = [];
  try {
    const cal = await getEconomicCalendar("this-week", "Asia/Tehran");
    news = cal.data
      .filter((e) => e.impact === "high" || e.impact === "medium")
      .map((e) => ({ kind: "news" as const, title: e.title, subtitle: `${e.currency} · ${e.impact === "high" ? "High Impact" : "Medium Impact"}`, href: "/economic-calendar/" }));
  } catch {
    /* news search is best-effort */
  }

  return [...all, ...news].filter((r) => norm(r.title).includes(q) || norm(r.subtitle).includes(q)).slice(0, 20);
}
