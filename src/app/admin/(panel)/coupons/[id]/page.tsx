import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import { CouponForm } from "@/components/admin/CouponForm";

export default async function EditCoupon({ params }: PageProps<"/admin/coupons/[id]">) {
  const { id } = await params;
  const d = await db();
  const firms = await d.select({ id: schema.propFirms.id, name: schema.propFirms.name }).from(schema.propFirms).orderBy(asc(schema.propFirms.name));
  let coupon = null;
  if (id !== "new") {
    [coupon] = await d.select().from(schema.coupons).where(eq(schema.coupons.id, Number(id)));
    if (!coupon) notFound();
  }
  return (
    <>
      <PageTitle title={coupon ? `ویرایش ${coupon.title}` : "کد تخفیف جدید"} back={{ href: "/admin/coupons/", label: "کدهای تخفیف" }} />
      <CouponForm firms={firms} coupon={coupon} />
    </>
  );
}
