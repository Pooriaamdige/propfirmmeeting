import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import { ArticleForm } from "@/components/admin/ArticleForm";

export default async function EditArticle({ params }: PageProps<"/admin/articles/[id]">) {
  const { id } = await params;
  let article = null;
  if (id !== "new") {
    const d = await db();
    [article] = await d.select().from(schema.articles).where(eq(schema.articles.id, Number(id)));
    if (!article) notFound();
  }
  return (
    <>
      <PageTitle title={article ? "ویرایش مقاله" : "مقاله جدید"} back={{ href: "/admin/articles/", label: "مقالات" }} />
      <ArticleForm article={article} />
    </>
  );
}
