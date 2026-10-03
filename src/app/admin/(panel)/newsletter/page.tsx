import { count, desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { PageTitle, Table, fmtDate } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/client";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { deleteSubscriberAction } from "../../actions";

export default async function AdminNewsletter() {
  const d = await db();
  const [[total], rows] = await Promise.all([d.select({ n: count() }).from(schema.newsletterSubscribers), d.select().from(schema.newsletterSubscribers).orderBy(desc(schema.newsletterSubscribers.createdAt)).limit(1000)]);
  return (
    <>
      <PageTitle
        title="خبرنامه"
        subtitle={`${total.n.toLocaleString("fa-IR")} عضو`}
        action={
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from a route handler, not a page
          <a href="/admin/export/subscribers/" className={buttonClass("secondary")}>
            <Icon name="download" size={15} /> خروجی CSV
          </a>
        }
      />
      <Table head={["ایمیل", "منبع", "تاریخ عضویت", ""]} empty={rows.length === 0}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className="px-4 py-2.5" dir="ltr">{r.email}</td>
            <td className="px-4 py-2.5 text-xs text-muted">{r.source}</td>
            <td className="px-4 py-2.5 text-xs text-muted">{fmtDate(r.createdAt)}</td>
            <td className="px-4 py-2.5 text-end">
              <ConfirmButton action={deleteSubscriberAction} id={r.id} message={`${r.email} حذف شود؟`}>
                <Icon name="trash" size={13} />
              </ConfirmButton>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
