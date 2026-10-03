import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { articleCategories } from "@/lib/categories";
import { Badge, Flash, PageTitle, Table, fmtDate } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/client";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { deleteArticleAction } from "../../actions";

export default async function AdminArticles({ searchParams }: PageProps<"/admin/articles">) {
  const sp = await searchParams;
  const d = await db();
  const rows = await d.select().from(schema.articles).orderBy(desc(schema.articles.publishedAt));
  return (
    <>
      <PageTitle
        title="مقالات"
        subtitle="مطالب آموزشی و تحلیلی بلاگ"
        action={
          <Link href="/admin/articles/new/" className={buttonClass("primary")}>
            <Icon name="plus" size={16} /> مقاله جدید
          </Link>
        }
      />
      <Flash saved={sp.saved === "1"} />
      <Table head={["عنوان", "دسته", "تاریخ انتشار", "وضعیت", ""]} empty={rows.length === 0}>
        {rows.map((a) => (
          <tr key={a.id} className="hover:bg-surface/40">
            <td className="px-4 py-3">
              <Link href={`/admin/articles/${a.id}/`} className="font-medium hover:text-accent">
                {a.title}
              </Link>
            </td>
            <td className="px-4 py-3 text-xs">{articleCategories.find((c) => c.id === a.category)?.label}</td>
            <td className="px-4 py-3 text-xs text-muted">{fmtDate(a.publishedAt)}</td>
            <td className="px-4 py-3">{a.published ? <Badge tone="pos">منتشر</Badge> : <Badge>پیش‌نویس</Badge>}</td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-1">
                <Link href={`/blog/${a.slug}/`} target="_blank" className="rounded-md p-1.5 text-muted hover:bg-surface" aria-label="مشاهده">
                  <Icon name="eye" size={14} />
                </Link>
                <Link href={`/admin/articles/${a.id}/`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-surface">
                  <Icon name="edit" size={13} /> ویرایش
                </Link>
                <ConfirmButton action={deleteArticleAction} id={a.id} message={`مقاله «${a.title}» حذف شود؟`}>
                  <Icon name="trash" size={13} /> حذف
                </ConfirmButton>
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
