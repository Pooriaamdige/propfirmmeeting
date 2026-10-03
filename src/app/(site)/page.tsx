import { getFeaturedPropFirms, getPropFirms } from "@/lib/services/propFirmService";
import { getArticles } from "@/lib/services/articleService";
import { getActiveCoupons } from "@/lib/services/couponService";
import { getSettings } from "@/lib/services/settingsService";
import { getActiveCampaign } from "@/lib/services/lotteryService";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { BlurText, NumberTicker, Stagger, StaggerItem } from "@/components/fx/Motion";
import { SpotlightCard } from "@/components/fx/Spotlight";
import { HeroScene } from "@/components/home/HeroScene";
import { FeatureBento } from "@/components/home/FeatureBento";
import { HowItWorks } from "@/components/home/HowItWorks";
import { FirmMarquee } from "@/components/home/FirmMarquee";
import { HeroDashboard } from "@/components/market/HeroDashboard";
import { Ticker } from "@/components/market/Ticker";
import { MarketOverview } from "@/components/market/MarketOverview";
import { NewsFeed } from "@/components/news/NewsFeed";
import { PropFirmCard } from "@/components/propfirms/PropFirmCard";
import { CouponCard } from "@/components/coupons/CouponCard";
import { ArticleCard } from "@/components/blog/ArticleCard";
import { NewsletterForm } from "@/components/forms/NewsletterForm";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [firms, featured, articles, coupons, settings, campaign] = await Promise.all([getPropFirms(), getFeaturedPropFirms(3), getArticles(), getActiveCoupons(), getSettings(), getActiveCampaign().catch(() => null)]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden" aria-labelledby="hero-title">
        <HeroScene />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-14 pt-12 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:px-8 lg:pb-20">
          <div>
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-accent-2/25 bg-card/60 px-3 py-1 text-xs text-muted backdrop-blur">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                مرجع فارسی بررسی <span className="latin text-accent-2">Prop Firm</span>ها
              </p>
            </Reveal>
            <h1 id="hero-title" className="mt-6 text-[2.1rem] font-black leading-[1.35] tracking-tight sm:text-5xl sm:leading-[1.3] lg:text-[3.4rem]">
              <BlurText text={settings.hero.title} className="block" />
              <BlurText text={settings.hero.highlight} className="block" wordClassName="text-shine pb-2" delay={0.25} />
            </h1>
            <Reveal delay={200}>
              <p className="mt-6 max-w-xl text-base leading-8 text-muted md:text-lg md:leading-9">{settings.hero.subtitle}</p>
            </Reveal>
            <Reveal delay={300} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/prop-firms/" size="lg" className="w-full sm:w-auto">
                مشاهده پراپ‌فرم‌ها
                <Icon name="arrow-left" size={18} className="transition-transform group-hover:-translate-x-1" />
              </LinkButton>
              <LinkButton href="/coupons/" variant="secondary" size="lg" className="w-full border-accent-2/40 sm:w-auto">
                <Icon name="ticket" size={18} className="text-accent-2" />
                کدهای تخفیف
              </LinkButton>
            </Reveal>
            <Reveal delay={400}>
              <dl className="mt-12 grid max-w-lg grid-cols-3 divide-x divide-x-reverse divide-line border-y border-line py-5">
                {[
                  { label: "پراپ‌فرم بررسی‌شده", value: firms.length },
                  { label: "کد تخفیف فعال", value: coupons.length },
                  { label: "نماد بازار زنده", value: 10 },
                ].map((s) => (
                  <div key={s.label} className="px-4 first:ps-0">
                    <dt className="text-xs text-muted">{s.label}</dt>
                    <dd className="mt-1 text-2xl font-bold text-accent-2">
                      <NumberTicker value={s.value} />
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
          <Reveal delay={200}>
            <HeroDashboard />
          </Reveal>
        </div>
        <div className="relative pb-10">
          <FirmMarquee firms={firms} />
        </div>
      </section>

      <Ticker />

      {/* What you get */}
      <Section id="features" labelledBy="features-title">
        <SectionHeader id="features-title" eyebrow="Everything in one place" title="هر چیزی که قبل از خرید چالش لازم داری" subtitle="از بررسی قوانین تا کد تخفیف و داده‌های زنده بازار — هر بخش صفحه اختصاصی خودش را دارد." />
        <FeatureBento />
      </Section>

      {/* Featured firms */}
      <Section id="prop-firms" labelledBy="prop-firms-title" className="border-t border-line">
        <SectionHeader
          id="prop-firms-title"
          eyebrow="Featured Prop Firms"
          title="پراپ‌فرم‌های منتخب"
          subtitle="شرایط کلیدی هر پراپ‌فرم در یک نگاه؛ برای جزئیات کامل وارد صفحه تحلیل شو."
          action={<LinkButton href="/prop-firms/" variant="secondary" size="sm">همه پراپ‌فرم‌ها <Icon name="arrow-left" size={15} /></LinkButton>}
        />
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((f) => (
            <StaggerItem key={f.id}>
              <PropFirmCard firm={f} />
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* Coupons */}
      {coupons.length > 0 && (
        <Section id="coupons" labelledBy="coupons-title" className="overflow-hidden border-t border-line">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,var(--glow),transparent_70%)]" aria-hidden />
          <SectionHeader
            id="coupons-title"
            eyebrow="Exclusive Coupons"
            title="کدهای تخفیف اختصاصی"
            subtitle="با پراپ‌فرم‌های همکار تخفیف گرفته‌ایم؛ کد را کپی کن و ارزان‌تر بخر."
            action={<LinkButton href="/coupons/" size="sm">همه کدها <Icon name="arrow-left" size={15} /></LinkButton>}
          />
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.slice(0, 3).map((c) => (
              <StaggerItem key={c.id}>
                <CouponCard coupon={c} />
              </StaggerItem>
            ))}
          </Stagger>
        </Section>
      )}

      {/* Markets */}
      <Section id="markets" labelledBy="markets-title" className="border-t border-line">
        <SectionHeader id="markets-title" eyebrow="Live Markets" title="امروز در بازار" subtitle="قیمت لحظه‌ای مهم‌ترین نمادها؛ نمودار کامل و ساعت سشن‌ها در صفحه بازارها." action={<LinkButton href="/markets/" variant="secondary" size="sm">نمودار و بازارها <Icon name="arrow-left" size={15} /></LinkButton>} />
        <MarketOverview />
      </Section>

      {/* News */}
      <Section id="news" labelledBy="news-title" className="border-t border-line">
        <SectionHeader id="news-title" eyebrow="Forex Factory" title="اخبار مهم پیش رو" subtitle="رویدادهای پراهمیت به وقت تهران؛ برای رعایت قوانین خبری پراپ‌فرم‌ها." action={<LinkButton href="/economic-calendar/" variant="secondary" size="sm">تقویم اقتصادی <Icon name="arrow-left" size={15} /></LinkButton>} />
        <Reveal>
          <NewsFeed limit={5} showMoreLink />
        </Reveal>
      </Section>

      {/* How it works */}
      <Section id="how" labelledBy="how-title" className="border-t border-line">
        <SectionHeader id="how-title" eyebrow="How it works" title="سه قدم تا انتخاب درست" />
        <HowItWorks />
      </Section>

      {/* Articles */}
      <Section id="articles" labelledBy="articles-title" className="border-t border-line">
        <SectionHeader id="articles-title" eyebrow="Learn" title="آخرین مطالب آموزشی" action={<LinkButton href="/blog/" variant="ghost" size="sm">همه مطالب <Icon name="arrow-left" size={15} /></LinkButton>} />
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 3).map((a) => (
            <StaggerItem key={a.slug}>
              <ArticleCard article={a} />
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* Lottery + newsletter */}
      <Section id="newsletter" labelledBy="newsletter-title">
        <div className="grid gap-5 lg:grid-cols-2">
          {campaign && (
            <Reveal>
              <SpotlightCard className="card border-beam relative flex h-full flex-col justify-between overflow-hidden rounded-2xl p-8">
                <div className="pointer-events-none absolute -top-24 start-1/4 h-56 w-56 rounded-full bg-accent/20 blur-3xl" aria-hidden />
                <div>
                  <span className="float-slow inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon name="gift" size={24} />
                  </span>
                  <h2 className="mt-5 text-2xl font-black md:text-3xl">در قرعه‌کشی ما شرکت کن</h2>
                  <p className="mt-3 leading-8 text-muted">{campaign.title}{campaign.prize ? ` — جایزه: ${campaign.prize}` : ""}</p>
                </div>
                <LinkButton href="/lottery/" size="lg" className="mt-8 w-full sm:w-auto">
                  ثبت‌نام در قرعه‌کشی <Icon name="arrow-left" size={18} />
                </LinkButton>
              </SpotlightCard>
            </Reveal>
          )}
          <Reveal delay={100} className={campaign ? "" : "lg:col-span-2"}>
            <div className="flex h-full flex-col justify-center rounded-2xl border border-line bg-surface/60 p-8 backdrop-blur">
              <h2 id="newsletter-title" className="text-2xl font-bold md:text-3xl">
                نبض بازار را از دست نده
              </h2>
              <p className="mb-6 mt-3 text-sm leading-7 text-muted">هفته‌ای یک ایمیل: اخبار پراهمیت هفته به وقت تهران، کدهای تخفیف جدید و تغییر قوانین پراپ‌فرم‌ها. بدون تبلیغات و سیگنال.</p>
              <NewsletterForm />
            </div>
          </Reveal>
        </div>
      </Section>
    </>
  );
}
