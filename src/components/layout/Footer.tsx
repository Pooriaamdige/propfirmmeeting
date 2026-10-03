import Link from "next/link";
import { SITE } from "@/lib/site";
import type { SiteSettings } from "@/lib/settings-defaults";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "./Logo";

const COLUMNS = [
  {
    title: "پلتفرم",
    links: [
      { href: "/prop-firms/", label: "پراپ‌فرم‌ها" },
      { href: "/compare/", label: "مقایسه" },
      { href: "/coupons/", label: "کدهای تخفیف" },
      { href: "/lottery/", label: "قرعه‌کشی" },
      { href: "/markets/", label: "بازارها" },
      { href: "/news/", label: "اخبار" },
      { href: "/economic-calendar/", label: "تقویم اقتصادی" },
    ],
  },
  {
    title: "ابزارها",
    links: [
      { href: "/tools/#position-size", label: "محاسبه‌گر ریسک" },
      { href: "/tools/#drawdown", label: "محاسبه‌گر دراداون" },
      { href: "/tools/#position-size", label: "Position Size" },
    ],
  },
  {
    title: "محتوا",
    links: [
      { href: "/blog/", label: "مقالات" },
      { href: "/blog/?category=education", label: "آموزش" },
      { href: "/blog/?category=market-news", label: "اخبار" },
    ],
  },
];

export function Footer({ social }: { social: SiteSettings["social"] }) {
  const SOCIAL = [
    { href: social.telegram, label: "Telegram", icon: "telegram" as const },
    { href: social.instagram, label: "Instagram", icon: "instagram" as const },
    { href: social.x, label: "X", icon: "x-logo" as const },
    { href: social.email, label: "Email", icon: "mail" as const },
  ].filter((s) => s.href);
  return (
    <footer className="relative mt-8 border-t border-line bg-surface/40">
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Logo />
            <p className="mt-5 max-w-sm text-sm leading-7 text-muted">{SITE.tagline}. داده‌های پراپ‌فرم‌ها با تاریخ بررسی و منبع رسمی منتشر می‌شوند.</p>
          </div>
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title} className="md:col-span-2">
              <h3 className="mb-4 text-sm font-semibold">{col.title}</h3>
              <ul className="space-y-2.5 text-sm text-muted">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="transition hover:text-accent">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="md:col-span-2">
            <h3 className="mb-4 text-sm font-semibold">ارتباط</h3>
            <ul className="space-y-2.5 text-sm text-muted">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <a href={s.href} className="inline-flex items-center gap-2 transition hover:text-accent" rel="noopener noreferrer" target={s.href.startsWith("http") ? "_blank" : undefined}>
                    <Icon name={s.icon} size={15} />
                    <span className="latin">{s.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-line bg-card/50 p-5">
          <p className="flex gap-3 text-[13px] leading-7 text-muted">
            <Icon name="info" size={18} className="mt-1 shrink-0 text-warn" />
            اطلاعات این وب‌سایت صرفاً با هدف اطلاع‌رسانی و آموزشی ارائه می‌شود و به منزله توصیه سرمایه‌گذاری یا پیشنهاد خرید و فروش نیست. معامله در بازارهای مالی با ریسک بالای از دست دادن سرمایه همراه است و قوانین پراپ‌فرم‌ها ممکن است بدون اطلاع قبلی تغییر کنند.
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 text-xs text-faint sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.name}. تمام حقوق محفوظ است.</p>
          <p className="latin">Market data: Twelve Data · Yahoo Finance · Binance · Coinbase · Forex Factory</p>
        </div>
      </div>
    </footer>
  );
}
