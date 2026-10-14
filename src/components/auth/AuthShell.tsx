import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";
import { ParticleField } from "@/components/fx/ParticleField";

const POINTS: { icon: IconName; text: string }[] = [
  { icon: "book", text: "ژورنال معاملات با ثبت دستی یا فایل CSV" },
  { icon: "chart", text: "آمار کامل: Win Rate، Profit Factor، دراداون، Expectancy و R" },
  { icon: "shield", text: "پایش قوانین پراپ: دراداون روزانه و کلی، تارگت و حداقل روز" },
  { icon: "calendar", text: "تحلیل روز، ساعت، سشن، نماد و اشتباهات معاملاتی" },
];

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <ParticleField density={0.00005} />
      <div className="relative mx-auto grid min-h-[78vh] max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="hidden lg:block">
          <p className="font-brand text-xs font-semibold uppercase tracking-[0.22em] text-accent-2">Trading Journal</p>
          <h2 className="mt-3 text-4xl font-black leading-tight">
            ژورنال معاملاتی‌ات را <span className="text-shine">حرفه‌ای</span> ثبت کن
          </h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p.text} className="flex items-center gap-3 text-muted">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon name={p.icon} size={17} />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </div>
        <div className="card border-beam mx-auto w-full max-w-md p-7">
          <h1 className="text-2xl font-black">{title}</h1>
          <p className="mb-6 mt-1 text-sm text-muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
