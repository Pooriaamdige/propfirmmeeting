import Link from "next/link";
import type { Article } from "@/lib/types";
import { articleCategories } from "@/data/articles";
import { formatJalaliDate, toFaDigits } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

/** Deterministic abstract cover — no stock photos. */
function Cover({ slug }: { slug: string }) {
  let h = 0;
  for (const c of slug) h = (h * 33 + c.charCodeAt(0)) >>> 0;
  const pts = Array.from({ length: 14 }, (_, i) => {
    const v = Math.sin(h / 1000 + i * 0.9) * 0.5 + Math.sin(h / 77 + i * 0.37) * 0.35;
    return [i * (300 / 13), 60 - v * 32] as const;
  });
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 300 120" className="h-full w-full" aria-hidden preserveAspectRatio="none">
      {pts.map(([x, y], i) => (
        <rect key={i} x={x - 3} y={y - 10 - (i % 3) * 4} width="6" height={20 + (i % 4) * 5} rx="1" fill="var(--border-strong)" />
      ))}
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.8" />
    </svg>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  const cat = articleCategories.find((c) => c.id === article.category);
  return (
    <article className="card group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-0.5 hover:border-line-strong">
      <div className="grid-bg relative h-32 border-b border-line bg-surface/60">
        <Cover slug={article.slug} />
        <span className="absolute start-4 top-4 rounded-md border border-line bg-card/90 px-2 py-0.5 text-[11px] font-medium text-accent backdrop-blur">{cat?.label}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-bold leading-8">
          <Link href={`/blog/${article.slug}/`} className="after:absolute after:inset-0 group-hover:text-accent">
            {article.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted">{article.excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-faint">
          <time dateTime={article.publishedAt}>{formatJalaliDate(article.publishedAt)}</time>
          <span className="inline-flex items-center gap-1">
            <Icon name="clock" size={13} />
            {toFaDigits(article.readingMinutes)} دقیقه
          </span>
        </div>
      </div>
    </article>
  );
}
