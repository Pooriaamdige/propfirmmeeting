import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader, Section, SectionHeader } from "@/components/ui/Section";
import { MarketOverview } from "@/components/market/MarketOverview";
import { MarketsChart } from "@/components/market/MarketsChart";
import { MarketClock } from "@/components/market/MarketClock";
import { Ticker } from "@/components/market/Ticker";

export const metadata: Metadata = {
  title: "بازارهای جهانی و نمودار فارکس",
  description: "قیمت طلا (XAUUSD)، یورو/دلار، پوند/دلار، دلار/ین، بیت‌کوین و شاخص دلار با نمودار تعاملی شمعی و خطی و ساعت سشن‌های معاملاتی به وقت تهران.",
  alternates: { canonical: "/markets/" },
  openGraph: { url: "/markets/", title: "بازارهای جهانی" },
};

export default function MarketsPage() {
  return (
    <>
      <PageHeader eyebrow="Markets" title="بازارهای جهانی" subtitle="نمودار تعاملی، وضعیت امروز بازار و سشن‌های فعال — همه با ذکر منبع و زمان آخرین بروزرسانی." />
      <Ticker />
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <Suspense>
          <MarketsChart />
        </Suspense>
      </div>
      <Section>
        <SectionHeader title="امروز در بازار" eyebrow="Market Overview" />
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <MarketOverview />
          <MarketClock className="h-full" />
        </div>
      </Section>
    </>
  );
}
