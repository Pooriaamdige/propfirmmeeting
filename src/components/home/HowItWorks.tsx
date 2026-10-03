import { Icon, type IconName } from "@/components/ui/Icon";
import { Stagger, StaggerItem } from "@/components/fx/Motion";

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "search", title: "بررسی کن", text: "قوانین، دراداون و شرایط برداشت پراپ‌فرم‌ها را با تاریخ بررسی ببین." },
  { icon: "scale", title: "مقایسه کن", text: "پراپ‌فرم‌های منتخب را کنار هم بگذار و تفاوت‌ها را پیدا کن." },
  { icon: "ticket", title: "ارزان‌تر بخر", text: "با کد تخفیف اختصاصی، چالش را با هزینه کمتر شروع کن." },
];

export function HowItWorks() {
  return (
    <div className="relative">
      <div className="absolute inset-x-[16%] top-8 hidden h-px bg-linear-to-l from-transparent via-accent-2/50 to-transparent md:block" aria-hidden />
      <Stagger className="grid gap-6 md:grid-cols-3" gap={0.15}>
        {STEPS.map((s, i) => (
          <StaggerItem key={s.title}>
            <div className="relative text-center">
              <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-accent-2/30 bg-card text-accent-2 shadow-[0_0_40px_-8px_var(--accent)]">
                <Icon name={s.icon} size={26} />
                <span className="num absolute -end-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-contrast">{(i + 1).toLocaleString("fa-IR")}</span>
              </span>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-7 text-muted">{s.text}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
