import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/Section";
import { NewsFeed } from "@/components/news/NewsFeed";
import { MarketClock } from "@/components/market/MarketClock";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "اخبار مهم بازار فارکس (Forex Factory)",
  description: "رویدادهای اقتصادی پراهمیت فارکس با Actual، Forecast و Previous به وقت تهران، UTC، لندن و نیویورک.",
  alternates: { canonical: "/news/" },
  openGraph: { url: "/news/", title: "اخبار مهم بازار" },
};

export default function NewsPage() {
  return (
    <>
      <PageHeader eyebrow="Forex Factory News" title="اخبار مهم بازار" subtitle="اخبار با اثر متوسط و بالا که اخیراً منتشر شده‌اند یا به‌زودی منتشر می‌شوند. زمان‌ها به‌صورت پیش‌فرض به وقت تهران است." />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <NewsFeed />
        <aside className="space-y-4">
          <MarketClock />
          <div className="card p-5 text-sm leading-7 text-muted">
            <h2 className="mb-2 font-bold text-fg">قوانین خبری پراپ‌فرم‌ها</h2>
            بسیاری از پراپ‌فرم‌ها معامله در بازه چند دقیقه قبل و بعد از اخبار قرمز (High Impact) را در حساب Funded محدود می‌کنند.
            <div className="mt-4">
              <LinkButton href="/compare/" variant="secondary" size="sm">مقایسه قوانین خبری</LinkButton>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
