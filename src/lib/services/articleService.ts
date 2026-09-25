import type { Article } from "@/lib/types";
import { articles } from "@/data/articles";

export async function getArticles(): Promise<Article[]> {
  return [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function getArticle(slug: string): Promise<Article | null> {
  return articles.find((a) => a.slug === slug) ?? null;
}
