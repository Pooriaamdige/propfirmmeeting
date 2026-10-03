import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Badge, Flash, PageTitle, Table, fmtDate, isPast } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/client";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { deleteCouponAction, toggleCouponAction } from "../../actions";

export default async function AdminCoupons({ searchParams }: PageProps<"/admin/coupons">) {
  const sp = await searchParams;
  const d = await db();
  const rows = await d
    .select()
    .from(schema.coupons)
    .leftJoin(schema.propFirms, eq(schema.coupons.firmId, schema.propFirms.id))
    .orderBy(desc(schema.coupons.featured), asc(schema.coupons.sortOrder), desc(schema.coupons.id));
  return (
    <>
      <PageTitle
        title="کدهای تخفیف"
        subtitle="کدهایی که کاربران در صفحه «کدهای تخفیف» کپی می‌کنند"
        action={
          <Link href="/admin/coupons/new/" className={buttonClass("primary")}>
            <Icon name="plus" size={16} /> کد جدید
          </Link>
        }
      />
      <Flash saved={sp.saved === "1"} />
      <Table head={["عنوان", "پراپ‌فرم", "کد", "تخفیف", "انقضا", "کپی", "وضعیت", ""]} empty={rows.length === 0}>
        {rows.map(({ coupons: c, prop_firms: f }) => {
          const expired = isPast(c.expiresAt);
          return (
            <tr key={c.id} className="hover:bg-surface/40">
              <td className="px-4 py-3">
                <Link href={`/admin/coupons/${c.id}/`} className="font-medium hover:text-accent">
                  {c.title}
                </Link>
                {c.featured && <span className="ms-2"><Badge tone="accent">ویژه</Badge></span>}
              </td>
              <td className="latin px-4 py-3 text-xs">{f?.name ?? "—"}</td>
              <td className="px-4 py-3">
                <code className="rounded bg-surface px-2 py-1 text-xs font-semibold text-accent-2" dir="ltr">{c.code}</code>
              </td>
              <td className="px-4 py-3 text-xs">{c.discountLabel}</td>
              <td className="px-4 py-3 text-xs text-muted">{c.expiresAt ? fmtDate(c.expiresAt) : "بدون انقضا"}</td>
              <td className="num px-4 py-3 text-xs">{c.copyCount}</td>
              <td className="px-4 py-3">
                <form action={toggleCouponAction}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="cursor-pointer">{expired ? <Badge tone="neg">منقضی</Badge> : c.active ? <Badge tone="pos">فعال</Badge> : <Badge>غیرفعال</Badge>}</button>
                </form>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/admin/coupons/${c.id}/`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-surface">
                    <Icon name="edit" size={13} /> ویرایش
                  </Link>
                  <ConfirmButton action={deleteCouponAction} id={c.id} message={`کد «${c.code}» حذف شود؟`}>
                    <Icon name="trash" size={13} /> حذف
                  </ConfirmButton>
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
