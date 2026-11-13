import type { Metadata } from "next";
import { PageHeader, SectionHeader } from "@/components/ui/Section";
import { PositionSizeCalculator } from "@/components/tools/PositionSizeCalculator";
import { MarginCalculator } from "@/components/tools/MarginCalculator";

export const metadata: Metadata = {
  title: "ابزار ترید: محاسبه‌گر حجم و مارجین",
  description: "محاسبه حجم معامله (Position Size) بر اساس ریسک و حد ضرر، و محاسبه مارجین موردنیاز بر اساس حجم، لوریج و قیمت لحظه‌ای.",
  alternates: { canonical: "/tools/" },
  openGraph: { url: "/tools/", title: "ابزار ترید" },
};

export default function ToolsPage() {
  return (
    <>
      <PageHeader eyebrow="Trader Tools" title="ابزار ترید" subtitle="قبل از هر معامله، حجم و ریسک را با اعداد دقیق بسنج." />
      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        <section id="position-size" aria-labelledby="ps-title">
          <SectionHeader id="ps-title" eyebrow="Position Size" title="محاسبه‌گر پراپ" subtitle="مبلغ ریسک، حجم پیشنهادی، زیان و سود احتمالی را بر اساس سایز حساب، درصد ریسک و حد ضرر محاسبه کن." />
          <PositionSizeCalculator />
        </section>
        <section id="margin" aria-labelledby="mg-title">
          <SectionHeader id="mg-title" eyebrow="Margin Calculator" title="محاسبه‌گر مارجین" subtitle="قبل از باز کردن معامله بدان چقدر مارجین درگیر می‌شود و با بالانس فعلی حداکثر چه حجمی می‌توانی باز کنی." />
          <MarginCalculator />
        </section>
      </div>
    </>
  );
}
