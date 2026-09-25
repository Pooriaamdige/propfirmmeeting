"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Article, ArticleCategory } from "@/lib/types";
import { articleCategories } from "@/data/articles";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/States";
import { ArticleCard } from "./ArticleCard";

export function BlogList({ articles }: { articles: Article[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const active = params.get("category") as ArticleCategory | null;
  const list = active ? articles.filter((a) => a.category === active) : articles;

  const select = (id: ArticleCategory | null) => router.replace(id ? `/blog/?category=${id}` : "/blog/", { scroll: false });

  return (
    <>
      <div className="scrollbar-thin -mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="دسته‌بندی مقالات">
        {[{ id: null, label: "همه" }, ...articleCategories].map((c) => (
          <button key={c.id ?? "all"} role="tab" aria-selected={active === c.id} onClick={() => select(c.id)} className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm transition", active === c.id ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-muted hover:text-fg")}>
            {c.label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <EmptyState icon="book" title="هنوز مطلبی در این دسته منتشر نشده است." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <div key={a.slug} className="relative">
              <ArticleCard article={a} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
