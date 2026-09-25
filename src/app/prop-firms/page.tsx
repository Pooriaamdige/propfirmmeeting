import type { Metadata } from "next";
import { Suspense } from "react";
import { getPropFirms } from "@/lib/services/propFirmService";
import { PageHeader } from "@/components/ui/Section";
import { PropFirmDirectory } from "@/components/propfirms/PropFirmDirectory";
import { JsonLd, breadcrumbLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "پراپ‌فرم‌های مورد بررسی",
  description: "لیست پراپ‌فرم‌های فارکس با هزینه چالش، تارگت، دراداون روزانه و کلی، تقسیم سود، قوانین خبر و آخر هفته — همراه با تاریخ آخرین بررسی.",
  alternates: { canonical: "/prop-firms/" },
  openGraph: { url: "/prop-firms/", title: "پراپ‌فرم‌های مورد بررسی" },
};

export default async function PropFirmsPage() {
  const firms = await getPropFirms();
  return (
    <>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "خانه", url: absoluteUrl("/") },
            { name: "پراپ‌فرم‌ها", url: absoluteUrl("/prop-firms/") },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: firms.map((f, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/prop-firms/${f.slug}/`), name: f.name })),
          },
        ]}
      />
      <PageHeader eyebrow="Prop Firm Directory" title="پراپ‌فرم‌های مورد بررسی" subtitle="شرایط و قوانین پراپ‌فرم‌های مختلف را قبل از خرید بررسی و مقایسه کن. همه اعداد برای حساب مرجع هر شرکت و با تاریخ بررسی نمایش داده می‌شوند.">
        <p className="mt-6 flex max-w-2xl gap-2 rounded-lg border border-warn/25 bg-warn/5 p-3 text-xs leading-6 text-muted">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-warn" />
          قوانین پراپ‌فرم‌ها مرتب تغییر می‌کنند. پیش از خرید، اطلاعات را با صفحه رسمی هر شرکت (لینک منبع در صفحه تحلیل) تطبیق دهید.
        </p>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense>
          <PropFirmDirectory firms={firms} />
        </Suspense>
      </div>
    </>
  );
}
