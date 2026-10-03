import type { Metadata } from "next";
import { Suspense } from "react";
import { getPropFirms } from "@/lib/services/propFirmService";
import { PageHeader } from "@/components/ui/Section";
import { CompareView } from "@/components/propfirms/CompareView";
import { QuickCompareTable } from "@/components/home/QuickCompareTable";
import { JsonLd, breadcrumbLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "مقایسه پراپ‌فرم‌ها",
  description: "چند پراپ‌فرم را انتخاب کن و هزینه چالش، تارگت، دراداون، تقسیم سود، لوریج، قوانین خبر و آخر هفته و برداشت سود را کنار هم مقایسه کن.",
  alternates: { canonical: "/compare/" },
  openGraph: { url: "/compare/", title: "مقایسه پراپ‌فرم‌ها" },
};

export const dynamic = "force-dynamic";

export default async function ComparePage() {
  const firms = await getPropFirms();
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "خانه", url: absoluteUrl("/") }, { name: "مقایسه پراپ‌فرم‌ها", url: absoluteUrl("/compare/") }])} />
      <PageHeader eyebrow="Compare Prop Firms" title="مقایسه پراپ‌فرم‌ها" subtitle="تا چهار پراپ‌فرم را انتخاب کن و شرایط را ردیف به ردیف ببین. لینک صفحه قابل اشتراک‌گذاری است." />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-lg font-bold">نمای کلی همه پراپ‌فرم‌ها</h2>
        <p className="mb-4 text-sm text-muted">روی عنوان ستون‌ها بزن تا مرتب شود؛ برای مقایسه دقیق، پراپ‌فرم‌ها را از لیست پایین انتخاب کن.</p>
        <QuickCompareTable firms={firms} />
        <div className="mt-12">
          <Suspense>
            <CompareView firms={firms} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
