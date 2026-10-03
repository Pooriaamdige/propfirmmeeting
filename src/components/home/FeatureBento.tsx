import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/Icon";
import { SpotlightCard } from "@/components/fx/Spotlight";
import { Stagger, StaggerItem } from "@/components/fx/Motion";

interface Tile {
  href: string;
  icon: IconName;
  title: string;
  en: string;
  text: string;
  className?: string;
  visual?: ReactNode;
}

function BarsVisual() {
  return (
    <div className="mt-6 flex h-20 items-end gap-1.5" aria-hidden dir="ltr">
      {[40, 65, 30, 80, 55, 95, 70, 45, 85, 60].map((h, i) => (
        <span key={i} className="flex-1 origin-bottom rounded-t bg-linear-to-t from-accent/30 to-accent-2/80" style={{ height: `${h}%`, animation: `rise 1s ${i * 0.07}s both, float ${5 + (i % 4)}s ${i * 0.3}s ease-in-out infinite` }} />
      ))}
    </div>
  );
}

function TicketVisual() {
  return (
    <div className="mt-6 flex items-center gap-3" aria-hidden>
      <code className="float-slow rounded-lg border border-dashed border-accent-2/50 bg-accent-2/10 px-3 py-2 font-mono text-sm font-bold tracking-widest text-accent-2" dir="ltr">
        PFM-20
      </code>
      <span className="float-slower rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-contrast">٪۲۰ تخفیف</span>
    </div>
  );
}

function CompareVisual() {
  return (
    <div className="mt-6 space-y-2" aria-hidden>
      {[92, 74, 58].map((w, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-10 rounded bg-line-strong" />
          <span className="h-2 rounded-full bg-linear-to-l from-accent to-accent-2" style={{ width: `${w}%`, animation: `rise .9s ${i * 0.12}s both`, transformOrigin: "right" }} />
        </div>
      ))}
    </div>
  );
}

const TILES: Tile[] = [
  { href: "/prop-firms/", icon: "shield", title: "بررسی پراپ‌فرم‌ها", en: "Prop Firm Reviews", text: "قوانین، دراداون، تقسیم سود، هزینه و شرایط برداشت هر پراپ‌فرم — با تاریخ آخرین بررسی و منبع رسمی.", className: "md:col-span-2 md:row-span-2", visual: <BarsVisual /> },
  { href: "/coupons/", icon: "ticket", title: "کدهای تخفیف", en: "Coupons", text: "کدهای اختصاصی پراپ‌فرم‌های همکار؛ با یک کلیک کپی کن.", className: "md:col-span-2", visual: <TicketVisual /> },
  { href: "/compare/", icon: "scale", title: "مقایسه کنار هم", en: "Compare", text: "تا ۴ پراپ‌فرم را ردیف‌به‌ردیف مقایسه کن.", visual: <CompareVisual /> },
  { href: "/markets/", icon: "candles", title: "بازارهای زنده", en: "Live Markets", text: "طلا، فارکس و کریپتو با نمودار تعاملی." },
  { href: "/news/", icon: "zap", title: "اخبار مهم", en: "Forex Factory", text: "اخبار پراهمیت به وقت تهران." },
  { href: "/economic-calendar/", icon: "calendar", title: "تقویم اقتصادی", en: "Calendar", text: "فیلتر ارز و اهمیت، چهار منطقه زمانی." },
  { href: "/tools/", icon: "calculator", title: "ابزار تریدر", en: "Tools", text: "محاسبه حجم معامله و دراداون." },
  { href: "/lottery/", icon: "gift", title: "قرعه‌کشی", en: "Giveaway", text: "در قرعه‌کشی‌های دوره‌ای شرکت کن." },
];

export function FeatureBento() {
  return (
    <Stagger className="grid auto-rows-[minmax(170px,auto)] gap-4 md:grid-cols-4">
      {TILES.map((t) => (
        <StaggerItem key={t.href} className={t.className}>
          <Link href={t.href} className="group block h-full rounded-2xl focus-visible:outline-offset-4">
            <SpotlightCard className="card flex h-full flex-col overflow-hidden rounded-2xl p-6 transition duration-300 group-hover:-translate-y-1">
              <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:scale-110 group-hover:bg-accent group-hover:text-accent-contrast">
                  <Icon name={t.icon} size={20} />
                </span>
                <span className="font-brand text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">{t.en}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold">{t.title}</h3>
              <p className="mt-1.5 text-sm leading-7 text-muted">{t.text}</p>
              {t.visual}
              <span className={cn("mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-accent opacity-0 transition group-hover:opacity-100")}>
                مشاهده <Icon name="arrow-left" size={14} className="transition-transform group-hover:-translate-x-1" />
              </span>
            </SpotlightCard>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
