import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Badge, Flash, PageTitle, Table } from "@/components/admin/ui";
import { formatJalaliDate } from "@/lib/format";
import { ConfirmButton } from "@/components/admin/client";
import { FirmLogo } from "@/components/propfirms/shared";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { deleteFirmAction, toggleFirmAction } from "../../actions";

export default async function AdminFirms({ searchParams }: PageProps<"/admin/prop-firms">) {
  const sp = await searchParams;
  const d = await db();
  const rows = await d.select().from(schema.propFirms).orderBy(asc(schema.propFirms.sortOrder), asc(schema.propFirms.id));
  return (
    <>
      <PageTitle
        title="پراپ‌فرم‌ها"
        subtitle="افزودن، ویرایش، ترتیب نمایش و انتشار پراپ‌فرم‌ها"
        action={
          <Link href="/admin/prop-firms/new/" className={buttonClass("primary")}>
            <Icon name="plus" size={16} /> پراپ‌فرم جدید
          </Link>
        }
      />
      <Flash saved={sp.saved === "1"} />
      <Table head={["پراپ‌فرم", "وضعیت بررسی", "آخرین بررسی", "انتشار", "ویژه", "ترتیب", ""]} empty={rows.length === 0}>
        {rows.map((r) => (
          <tr key={r.id} className="hover:bg-surface/40">
            <td className="px-4 py-3">
              <Link href={`/admin/prop-firms/${r.id}/`} className="flex items-center gap-3 hover:text-accent">
                <FirmLogo firm={{ name: r.name, logo: r.data.logo }} size={34} />
                <span>
                  <span className="latin block font-semibold">{r.name}</span>
                  <span className="block text-[11px] text-faint" dir="ltr">/{r.slug}</span>
                </span>
              </Link>
            </td>
            <td className="px-4 py-3">
              <Badge tone={r.data.status === "reviewed" ? "pos" : r.data.status === "outdated" ? "neg" : "warn"}>{r.data.status === "reviewed" ? "بررسی‌شده" : r.data.status === "outdated" ? "قدیمی" : "در حال بررسی"}</Badge>
            </td>
            <td className="px-4 py-3 text-xs text-muted">{formatJalaliDate(r.data.lastReviewedAt)}</td>
            <td className="px-4 py-3">
              <form action={toggleFirmAction}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="field" value="published" />
                <button className="cursor-pointer">{r.published ? <Badge tone="pos">منتشر</Badge> : <Badge>پیش‌نویس</Badge>}</button>
              </form>
            </td>
            <td className="px-4 py-3">
              <form action={toggleFirmAction}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="field" value="featured" />
                <button className="cursor-pointer">{r.featured ? <Badge tone="accent">ویژه</Badge> : <Badge>—</Badge>}</button>
              </form>
            </td>
            <td className="num px-4 py-3 text-xs">{r.sortOrder}</td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-1">
                <Link href={`/admin/prop-firms/${r.id}/`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-surface">
                  <Icon name="edit" size={13} /> ویرایش
                </Link>
                <ConfirmButton action={deleteFirmAction} id={r.id} message={`«${r.name}» حذف شود؟ کدهای تخفیف مرتبط بدون پراپ‌فرم می‌مانند.`}>
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
