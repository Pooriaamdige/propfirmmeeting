import { Suspense } from "react";
import { getPropFirms } from "@/lib/services/propFirmService";
import { getArticles } from "@/lib/services/articleService";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CountUp } from "@/components/ui/CountUp";
import { HeroBackground } from "@/components/home/HeroBackground";
import { QuickCompareTable } from "@/components/home/QuickCompareTable";
import { HeroDashboard } from "@/components/market/HeroDashboard";
import { Ticker } from "@/components/market/Ticker";
import { MarketOverview } from "@/components/market/MarketOverview";
import { ForexChart } from "@/components/market/ForexChart";
import { MarketClock } from "@/components/market/MarketClock";
import { NewsFeed } from "@/components/news/NewsFeed";
import { EconomicCalendar } from "@/components/news/EconomicCalendar";
import { PropFirmDirectory } from "@/components/propfirms/PropFirmDirectory";
import { PositionSizeCalculator } from "@/components/tools/PositionSizeCalculator";
import { DrawdownCalculator } from "@/components/tools/DrawdownCalculator";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { LotteryForm } from "@/components/forms/LotteryForm";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

export default async function HomePage() {
  const [firms, articles] = await Promise.all([getPropFirms(), getArticles()]);
  const presets = firms.map((f) => ({ slug: f.slug, name: f.name, daily: f.dailyDrawdown.value, max: f.maxDrawdown.value }));

  return (
    <>
      {/* 2. Hero */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <HeroBackground />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8 lg:pb-24">
          <div>
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1 text-xs text-muted backdrop-blur">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                مرجع فارسی تحلیل <span className="latin">Prop Firm</span>ها
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 id="hero-title" className="mt-6 text-[2.1rem] font-black leading-[1.35] tracking-tight sm:text-5xl sm:leading-[1.3] lg:text-[3.4rem]">
                قبل از خرید چالش،
                <br />
                <span className="bg-linear-to-l from-accent to-accent-2 bg-clip-text text-transparent">پراپ‌فرم را دقیق بررسی کن</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted md:text-lg md:leading-9">شرایط، قوانین، هزینه، دراداون، تقسیم سود و اعتبار پراپ‌فرم‌ها را در یکجا مقایسه کن.</p>
            </Reveal>
            <Reveal delay={240} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/prop-firms/" size="lg" className="w-full sm:w-auto">
                مشاهده پراپ‌فرم‌ها
                <Icon name="arrow-left" size={18} className="transition-transform group-hover:-translate-x-1" />
              </LinkButton>
              <LinkButton href="/compare/" variant="secondary" size="lg" className="w-full sm:w-auto">
                <Icon name="scale" size={18} />
                مقایسه پراپ‌فرم‌ها
              </LinkButton>
            </Reveal>
            <Reveal delay={320}>
              <dl className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-x-reverse divide-line border-y border-line py-5">
                <div className="px-4 first:ps-0">
                  <dt className="text-xs text-muted">پراپ‌فرم در حال پایش</dt>
                  <dd className="mt-1 text-2xl font-bold">
                    <CountUp to={firms.length} />
                  </dd>
                </div>
                <div className="px-4">
                  <dt className="text-xs text-muted">معیار مقایسه</dt>
                  <dd className="mt-1 text-2xl font-bold">
                    <CountUp to={20} suffix="+" />
                  </dd>
                </div>
                <div className="px-4">
                  <dt className="text-xs text-muted">نماد بازار</dt>
                  <dd className="mt-1 text-2xl font-bold">
                    <CountUp to={10} />
                  </dd>
                </div>
              </dl>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <HeroDashboard />
          </Reveal>
        </div>
      </section>

      {/* 3. Ticker */}
      <Ticker />

      {/* 4. Market overview */}
      <Section id="market-today" labelledBy="market-today-title">
        <SectionHeader id="market-today-title" eyebrow="Market Overview" title="امروز در بازار" subtitle="قیمت، تغییرات ۲۴ ساعته، سقف و کف روز برای مهم‌ترین نمادها." action={<LinkButton href="/markets/" variant="ghost" size="sm">همه بازارها <Icon name="arrow-left" size={15} /></LinkButton>} />
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <MarketOverview />
          <Reveal>
            <MarketClock className="h-full" />
          </Reveal>
        </div>
      </Section>

      {/* 5. Prop firm directory */}
      <Section id="prop-firms" labelledBy="prop-firms-title" className="border-t border-line bg-surface/30">
        <SectionHeader
          id="prop-firms-title"
          eyebrow="Prop Firm Directory"
          title="پراپ‌فرم‌های مورد بررسی"
          subtitle="شرایط و قوانین پراپ‌فرم‌های مختلف را قبل از خرید بررسی و مقایسه کن."
          action={<LinkButton href="/prop-firms/" variant="secondary" size="sm">مشاهده همه <Icon name="arrow-left" size={15} /></LinkButton>}
        />
        <Suspense>
          <PropFirmDirectory firms={firms} limit={6} />
        </Suspense>
      </Section>

      {/* 6. Comparison */}
      <Section id="compare" labelledBy="compare-title">
        <SectionHeader
          id="compare-title"
          eyebrow="Side-by-side"
          title="مقایسه سریع پراپ‌فرم‌ها"
          subtitle="روی عنوان هر ستون بزن تا مرتب شود. برای مقایسه کامل، پراپ‌فرم‌ها را به لیست مقایسه اضافه کن."
          action={<LinkButton href="/compare/" size="sm">صفحه مقایسه کامل <Icon name="arrow-left" size={15} /></LinkButton>}
        />
        <Reveal>
          <QuickCompareTable firms={firms} />
        </Reveal>
      </Section>

      {/* 7. Chart */}
      <Section id="charts" labelledBy="charts-title" className="border-t border-line bg-surface/30">
        <SectionHeader id="charts-title" eyebrow="Global Markets" title="بازارهای جهانی" subtitle="نمودار تعاملی با نمای شمعی و خطی در تایم‌فریم‌های مختلف." />
        <Reveal>
          <ForexChart />
        </Reveal>
      </Section>

      {/* 8 + 9. News & calendar */}
      <Section id="news" labelledBy="news-title">
        <SectionHeader id="news-title" eyebrow="Forex Factory" title="اخبار مهم بازار" subtitle="رویدادهای اقتصادی پراهمیت با زمان‌بندی به وقت تهران؛ مناسب برنامه‌ریزی معاملات و رعایت قوانین خبری پراپ‌ها." />
        <div className="grid gap-6">
          <Reveal>
            <NewsFeed limit={8} showMoreLink />
          </Reveal>
          <Reveal delay={100}>
            <div id="calendar">
              <h3 className="sr-only">تقویم اقتصادی</h3>
              <EconomicCalendar compact />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* 10 + 11. Tools */}
      <Section id="tools" labelledBy="tools-title" className="border-t border-line bg-surface/30">
        <SectionHeader id="tools-title" eyebrow="Trader Tools" title="محاسبه‌گر پراپ" subtitle="حجم مناسب هر معامله را بر اساس سایز حساب، درصد ریسک و حد ضرر محاسبه کن." />
        <Reveal>
          <PositionSizeCalculator />
        </Reveal>
        <div className="mt-16">
          <SectionHeader eyebrow="Drawdown" title="محاسبه دراداون" subtitle="حد مجاز زیان روزانه و کلی و ریسک باقی‌مانده حسابت را بدان." />
          <Reveal>
            <DrawdownCalculator presets={presets} />
          </Reveal>
        </div>
      </Section>

      {/* 12. Articles */}
      <Section id="articles" labelledBy="articles-title">
        <SectionHeader id="articles-title" eyebrow="Learn" title="آخرین مطالب آموزشی" action={<LinkButton href="/blog/" variant="ghost" size="sm">همه مطالب <Icon name="arrow-left" size={15} /></LinkButton>} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 3).map((a, i) => (
            <Reveal key={a.slug} delay={i * 80}>
              <ArticleCard article={a} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* 13. Lottery */}
      <Section id="lottery" labelledBy="lottery-title">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-card">
            <div className="grid-bg pointer-events-none absolute inset-0 opacity-70" aria-hidden />
            <div className="pointer-events-none absolute -top-40 start-1/4 h-80 w-80 rounded-full bg-accent/15 blur-3xl" aria-hidden />
            <div className="relative grid gap-10 p-6 md:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
              <div className="flex flex-col justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon name="gift" size={24} />
                </span>
                <h2 id="lottery-title" className="mt-6 text-3xl font-black tracking-tight md:text-4xl">
                  در قرعه‌کشی ما شرکت کن
                </h2>
                <p className="mt-4 text-base leading-8 text-muted">با ثبت اطلاعاتت، در قرعه‌کشی‌های دوره‌ای شرکت کن.</p>
                <ul className="mt-6 space-y-3 text-sm text-muted">
                  {["ثبت‌نام رایگان و یک‌بار برای هر دوره", "اعلام نتایج از طریق ایمیل و تلگرام", "اطلاعات شما محرمانه باقی می‌ماند"].map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <Icon name="check" size={16} className="text-accent" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-line bg-bg/40 p-5 backdrop-blur md:p-6">
                <LotteryForm />
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* 14. Newsletter */}
      <Section id="newsletter" labelledBy="newsletter-title" className="pt-0 md:pt-0">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-8 rounded-2xl border border-line bg-surface/50 p-6 md:p-10 lg:flex-row lg:items-center">
            <div className="max-w-xl">
              <h2 id="newsletter-title" className="text-2xl font-bold md:text-3xl">
                نبض بازار را از دست نده
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted">هفته‌ای یک ایمیل: خلاصه اخبار پراهمیت هفته پیش رو به وقت تهران، تغییرات قوانین پراپ‌فرم‌ها و مقالات آموزشی جدید. بدون تبلیغات و سیگنال.</p>
            </div>
            <NewsletterForm />
          </div>
        </Reveal>
      </Section>
    </>
  );
}
