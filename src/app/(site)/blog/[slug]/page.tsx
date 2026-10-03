import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, getArticles } from "@/lib/services/articleService";
import { articleCategories } from "@/lib/categories";
import { formatJalaliDate, toFaDigits } from "@/lib/format";
import { SITE, absoluteUrl } from "@/lib/site";
import { JsonLd, breadcrumbLd } from "@/components/seo/JsonLd";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { Icon } from "@/components/ui/Icon";
import { Markdown } from "@/components/blog/Markdown";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const a = await getArticle((await params).slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.excerpt,
    alternates: { canonical: `/blog/${a.slug}/` },
    openGraph: { type: "article", url: `/blog/${a.slug}/`, title: a.title, description: a.excerpt, publishedTime: a.publishedAt, modifiedTime: a.updatedAt },
  };
}

export default async function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const a = await getArticle((await params).slug);
  if (!a) notFound();
  const cat = articleCategories.find((c) => c.id === a.category);
  const related = (await getArticles()).filter((x) => x.slug !== a.slug).slice(0, 3);
  const url = absoluteUrl(`/blog/${a.slug}/`);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "خانه", url: absoluteUrl("/") },
            { name: "مقالات", url: absoluteUrl("/blog/") },
            { name: a.title, url },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: a.title,
            description: a.excerpt,
            inLanguage: "fa-IR",
            datePublished: a.publishedAt,
            dateModified: a.updatedAt,
            author: { "@type": "Organization", name: a.author },
            publisher: { "@type": "Organization", name: SITE.name, logo: { "@type": "ImageObject", url: absoluteUrl("/icon.svg") } },
            mainEntityOfPage: url,
          },
        ]}
      />
      <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <nav aria-label="مسیر صفحه" className="mb-8 text-xs text-muted">
          <Link href="/blog/" className="inline-flex items-center gap-1 hover:text-fg">
            <Icon name="arrow-right" size={14} />
            مقالات
          </Link>
        </nav>
        <header>
          <Link href={`/blog/?category=${a.category}`} className="text-sm font-medium text-accent">
            {cat?.label}
          </Link>
          <h1 className="mt-3 text-3xl font-black leading-[1.5] tracking-tight md:text-4xl md:leading-[1.45]">{a.title}</h1>
          <p className="mt-4 text-lg leading-9 text-muted">{a.excerpt}</p>
          <p className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-line py-3 text-xs text-muted">
            <span>{a.author}</span>
            <time dateTime={a.publishedAt}>انتشار: {formatJalaliDate(a.publishedAt)}</time>
            {a.updatedAt !== a.publishedAt && <time dateTime={a.updatedAt}>بروزرسانی: {formatJalaliDate(a.updatedAt)}</time>}
            <span>{toFaDigits(a.readingMinutes)} دقیقه مطالعه</span>
          </p>
        </header>
        <div className="mt-10">
          <Markdown source={a.body} />
        </div>
        <aside className="mt-12 rounded-xl border border-line bg-surface/50 p-5 text-sm leading-7 text-muted">
          این مطلب صرفاً آموزشی است و توصیه سرمایه‌گذاری محسوب نمی‌شود.
        </aside>
      </article>
      <section className="border-t border-line bg-surface/30 py-14" aria-labelledby="related">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="related" className="mb-6 text-xl font-bold">
            مطالب مرتبط
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <ArticleCard key={r.slug} article={r} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
