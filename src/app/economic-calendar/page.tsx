import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/Section";
import { EconomicCalendar } from "@/components/news/EconomicCalendar";

export const metadata: Metadata = {
  title: "تقویم اقتصادی فارکس به وقت تهران",
  description: "تقویم اقتصادی امروز، فردا، این هفته و هفته آینده با فیلتر ارز (USD, EUR, GBP, JPY, AUD, CAD, CHF, NZD) و میزان اهمیت خبر.",
  alternates: { canonical: "/economic-calendar/" },
  openGraph: { url: "/economic-calendar/", title: "تقویم اقتصادی" },
};

export default function CalendarPage() {
  return (
    <>
      <PageHeader eyebrow="Economic Calendar" title="تقویم اقتصادی" subtitle="رویدادهای اقتصادی را بر اساس بازه زمانی، ارز و میزان اهمیت فیلتر کن. منطقه زمانی قابل تغییر است." />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <EconomicCalendar />
      </div>
    </>
  );
}
