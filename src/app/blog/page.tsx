import type { Metadata } from "next";
import { Suspense } from "react";
import { getArticles } from "@/lib/services/articleService";
import { PageHeader } from "@/components/ui/Section";
import { BlogList } from "@/components/blog/BlogList";

export const metadata: Metadata = {
  title: "مقالات آموزشی فارکس و پراپ‌فرم",
  description: "آموزش پراپ‌فرم، فارکس، مدیریت سرمایه، روانشناسی معامله‌گری، استراتژی و اخبار بازار به زبان فارسی.",
  alternates: { canonical: "/blog/" },
  openGraph: { url: "/blog/", title: "مقالات آموزشی" },
};

export default async function BlogPage() {
  const articles = await getArticles();
  return (
    <>
      <PageHeader eyebrow="Blog" title="آخرین مطالب آموزشی" subtitle="مطالب کاربردی و بدون اغراق درباره پراپ‌فرم‌ها، مدیریت ریسک و بازار." />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense>
          <BlogList articles={articles} />
        </Suspense>
      </div>
    </>
  );
}
