import type { Metadata } from "next";
import { getPropFirms } from "@/lib/services/propFirmService";
import { PageHeader, SectionHeader } from "@/components/ui/Section";
import { PositionSizeCalculator } from "@/components/tools/PositionSizeCalculator";
import { DrawdownCalculator } from "@/components/tools/DrawdownCalculator";

export const metadata: Metadata = {
  title: "ابزارهای تریدر: محاسبه‌گر حجم و دراداون",
  description: "محاسبه حجم معامله (Position Size) بر اساس ریسک و حد ضرر، و محاسبه حداکثر زیان روزانه و کلی و ریسک باقی‌مانده حساب پراپ.",
  alternates: { canonical: "/tools/" },
  openGraph: { url: "/tools/", title: "ابزارهای تریدر" },
};

export const dynamic = "force-dynamic";

export default async function ToolsPage() {
  const firms = await getPropFirms();
  const presets = firms.map((f) => ({ slug: f.slug, name: f.name, daily: f.dailyDrawdown.value, max: f.maxDrawdown.value }));
  return (
    <>
      <PageHeader eyebrow="Trader Tools" title="ابزارهای تریدر" subtitle="قبل از هر معامله، حجم و ریسک را با اعداد دقیق بسنج." />
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        <section id="position-size" aria-labelledby="ps-title">
          <SectionHeader id="ps-title" eyebrow="Position Size" title="محاسبه‌گر پراپ" subtitle="مبلغ ریسک، حجم پیشنهادی، زیان و سود احتمالی را بر اساس سایز حساب، درصد ریسک و حد ضرر محاسبه کن." />
          <PositionSizeCalculator />
        </section>
        <section id="drawdown" aria-labelledby="dd-title">
          <SectionHeader id="dd-title" eyebrow="Drawdown" title="محاسبه دراداون" subtitle="حداکثر زیان روزانه و کلی و ریسک باقی‌مانده امروز را بدان." />
          <DrawdownCalculator presets={presets} />
        </section>
      </div>
    </>
  );
}
