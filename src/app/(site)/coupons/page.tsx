import type { Metadata } from "next";
import { getActiveCoupons } from "@/lib/services/couponService";
import { PageHeader } from "@/components/ui/Section";
import { CouponGrid } from "@/components/coupons/CouponGrid";
import { Icon } from "@/components/ui/Icon";
import { JsonLd, breadcrumbLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "کد تخفیف پراپ‌فرم‌ها",
  description: "کدهای تخفیف اختصاصی خرید چالش پراپ‌فرم‌ها؛ کد را کپی کن و ارزان‌تر بخر.",
  alternates: { canonical: "/coupons/" },
  openGraph: { url: "/coupons/", title: "کد تخفیف پراپ‌فرم‌ها" },
};

export default async function CouponsPage() {
  const coupons = await getActiveCoupons();
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "خانه", url: absoluteUrl("/") }, { name: "کد تخفیف", url: absoluteUrl("/coupons/") }])} />
      <PageHeader eyebrow="Exclusive Coupons" title="کدهای تخفیف پراپ‌فرم‌ها" subtitle="با پراپ‌فرم‌های همکار، کدهای تخفیف اختصاصی گرفته‌ایم. کد را کپی کن و هنگام خرید چالش وارد کن.">
        <ol className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
          {[
            ["copy", "کد را کپی کن"],
            ["external", "وارد سایت پراپ‌فرم شو"],
            ["check", "کد را هنگام پرداخت وارد کن"],
          ].map(([icon, label], i) => (
            <li key={label} className="flex items-center gap-3 rounded-xl border border-line bg-card/60 p-3 text-sm backdrop-blur">
              <span className="num flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 font-bold text-accent">{(i + 1).toLocaleString("fa-IR")}</span>
              <span className="flex-1">{label}</span>
              <Icon name={icon as "copy"} size={16} className="text-accent-2" />
            </li>
          ))}
        </ol>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <CouponGrid coupons={coupons} />
        <p className="mt-10 flex gap-2 text-xs leading-6 text-muted">
          <Icon name="info" size={14} className="mt-1 shrink-0 text-faint" />
          قبل از خرید، شرایط هر کد و قوانین پراپ‌فرم را بررسی کنید. ممکن است پراپ‌فرم‌ها کد را زودتر از زمان اعلام‌شده غیرفعال کنند.
        </p>
      </div>
    </>
  );
}
