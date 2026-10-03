import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Article, ArticleCategory } from "@/lib/types";
import { db, schema } from "@/lib/db";
import { remember } from "./contentCache";

type Row = typeof schema.articles.$inferSelect;

export function rowToArticle(r: Row): Article {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    category: r.category as ArticleCategory,
    body: r.body,
    author: r.author,
    readingMinutes: r.readingMinutes,
    published: r.published,
    publishedAt: r.publishedAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function getArticles(): Promise<Article[]> {
  return remember("articles:published", async () => {
    const d = await db();
    const rows = await d.select().from(schema.articles).where(eq(schema.articles.published, true)).orderBy(desc(schema.articles.publishedAt));
    return rows.map(rowToArticle);
  });
}

export async function getArticle(slug: string): Promise<Article | null> {
  return (await getArticles()).find((a) => a.slug === slug) ?? null;
}
