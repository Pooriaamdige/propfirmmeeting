import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/user-session";
import { listAccounts } from "@/lib/journal/service";
import { ACCOUNT_TYPES } from "@/lib/journal/instruments";
import { fmtMoney, fmtPct, toneOf } from "@/lib/journal/format";
import { PageHeader } from "@/components/ui/Section";
import { LinkButton, buttonClass } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/States";
import { SpotlightCard } from "@/components/fx/Spotlight";
import { Stagger, StaggerItem } from "@/components/fx/Motion";
import { Sparkline } from "@/components/market/Sparkline";
import { RuleStatusBadge } from "@/components/journal/ui";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "ژورنال معاملاتی",
  description: "ژورنال معاملات فارکس و پراپ با آمار کامل، تحلیل عملکرد و پایش قوانین پراپ‌فرم.",
  alternates: { canonical: "/journal/" },
};

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: "edit", title: "ثبت سریع معاملات", text: "ورود دستی با محاسبه خودکار پیپ، سود و R — یا وارد کردن یکجا با فایل CSV" },
  { icon: "chart", title: "آمار حرفه‌ای", text: "Gain، Win Rate، Profit Factor، Expectancy، Sharpe، Z-Score، دراداون و ۲۰+ شاخص دیگر" },
  { icon: "shield", title: "پایش قوانین پراپ", text: "دراداون روزانه و کلی، تارگت، حداقل روز و قانون ثبات — با هشدار پیش از نقض" },
  { icon: "calendar", title: "تحلیل زمان", text: "تقویم سود/زیان، عملکرد بر اساس روز هفته، ساعت و سشن معاملاتی" },
  { icon: "layers", title: "ستاپ، نماد و تگ", text: "بفهم کدام ستاپ و کدام نماد واقعاً برایت سود می‌سازد" },
  { icon: "alert", title: "هزینه اشتباهات", text: "ببین هر اشتباه (FOMO، جابجایی SL، …) چقدر از حسابت برده است" },
];

export default async function JournalPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <PageHeader eyebrow="Trading Journal" title="ژورنال معاملاتی" subtitle="معاملاتت را ثبت کن و با آمار دقیق بفهم کجا سود می‌کنی و کجا ضرر — مخصوص تریدرهای پراپ.">
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href="/register/?next=/journal/" size="lg">
              ساخت ژورنال رایگان <Icon name="arrow-left" size={18} />
            </LinkButton>
            <LinkButton href="/login/?next=/journal/" variant="secondary" size="lg">
              ورود
            </LinkButton>
          </div>
        </PageHeader>
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <StaggerItem key={f.title}>
                <SpotlightCard className="card h-full rounded-2xl p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Icon name={f.icon} size={20} />
                  </span>
                  <h2 className="mt-4 font-bold">{f.title}</h2>
                  <p className="mt-1.5 text-sm leading-7 text-muted">{f.text}</p>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </Stagger>
          <p className="mt-8 text-center text-xs text-muted">ثبت معاملات فعلاً دستی یا با فایل CSV است؛ اتصال خودکار به MT4/MT5 در نسخه‌های بعدی اضافه می‌شود.</p>
        </div>
      </>
    );
  }

  const items = await listAccounts(user.id);
  const active = items.filter((x) => !x.account.archived);
  const archived = items.filter((x) => x.account.archived);

  return (
    <>
      <PageHeader eyebrow="Trading Journal" title="ژورنال معاملاتی" subtitle={`سلام ${user.name || ""}! حساب‌هایت را انتخاب کن یا حساب جدید بساز.`}>
        <div className="mt-6 flex flex-wrap gap-3">
          <LinkButton href="/journal/accounts/new/">
            <Icon name="plus" size={16} /> حساب جدید
          </LinkButton>
          <LinkButton href="/account/" variant="ghost">
            <Icon name="user" size={16} /> حساب کاربری
          </LinkButton>
        </div>
      </PageHeader>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {active.length === 0 ? (
          <EmptyState
            icon="book"
            title="هنوز حسابی نساخته‌ای."
            description="برای هر حساب (مثلاً چالش FTMO 100K یا حساب شخصی) یک ژورنال جدا بساز تا آمار و قوانینش جدا پایش شود."
            action={<LinkButton href="/journal/accounts/new/">ساخت اولین حساب</LinkButton>}
          />
        ) : (
          <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {active.map(({ account: a, stats: s }) => (
              <StaggerItem key={a.id}>
                <Link href={`/journal/accounts/${a.id}/`} className="group block h-full">
                  <SpotlightCard className="card flex h-full flex-col rounded-2xl p-5 transition group-hover:-translate-y-0.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate font-bold">{a.name}</h2>
                        <p className="mt-0.5 text-xs text-muted">
                          {ACCOUNT_TYPES.find((t) => t.id === a.type)?.label}
                          {a.firmName && <span className="latin"> · {a.firmName}</span>}
                        </p>
                      </div>
                      <RuleStatusBadge status={s.ruleStatus} />
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted">بالانس</p>
                        <p className="num text-2xl font-bold">{fmtMoney(s.balance, a.currency)}</p>
                        <p className={cn("num text-sm font-semibold", toneOf(s.gainPct))}>{fmtPct(s.gainPct)}</p>
                      </div>
                      <Sparkline values={s.curve.map((p) => p.balance)} positive={s.netProfit >= 0} width={120} height={44} />
                    </div>
                    <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
                      <div>
                        <dt className="text-muted">معاملات</dt>
                        <dd className="num mt-0.5 font-semibold">{s.trades.total}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Win Rate</dt>
                        <dd className="num mt-0.5 font-semibold">{fmtPct(s.winRate, false)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Max DD</dt>
                        <dd className="num mt-0.5 font-semibold">{fmtPct(s.maxDrawdownPct, false)}</dd>
                      </div>
                    </dl>
                  </SpotlightCard>
                </Link>
              </StaggerItem>
            ))}
            <StaggerItem>
              <Link href="/journal/accounts/new/" className="flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong text-muted transition hover:border-accent/50 hover:text-accent">
                <Icon name="plus" size={22} />
                حساب جدید
              </Link>
            </StaggerItem>
          </Stagger>
        )}
        {archived.length > 0 && (
          <details className="mt-10">
            <summary className="cursor-pointer text-sm text-muted">حساب‌های بایگانی‌شده ({archived.length.toLocaleString("fa-IR")})</summary>
            <ul className="mt-3 space-y-2">
              {archived.map(({ account: a, stats: s }) => (
                <li key={a.id}>
                  <Link href={`/journal/accounts/${a.id}/`} className={cn(buttonClass("ghost", "sm"), "justify-start")}>
                    {a.name} · <span className={cn("num", toneOf(s.netProfit))}>{fmtMoney(s.netProfit, a.currency, true)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </>
  );
}
