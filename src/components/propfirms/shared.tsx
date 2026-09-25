import type { PropFirm, ReviewStatus, RuleDetail, RuleStatus } from "@/lib/types";
import { cn } from "@/lib/cn";
import { formatJalaliDate, formatMoney, toFaDigits } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

export function FirmLogo({ firm, size = 44 }: { firm: Pick<PropFirm, "logo" | "name">; size?: number }) {
  return (
    <span
      className="latin flex shrink-0 items-center justify-center rounded-xl border border-line-strong font-extrabold"
      style={{ width: size, height: size, fontSize: size * 0.34, color: firm.logo.color, background: `color-mix(in srgb, ${firm.logo.color} 10%, var(--card))` }}
      aria-hidden
    >
      {firm.logo.monogram}
    </span>
  );
}

export const RULE_META: Record<RuleStatus, { label: string; className: string; icon: "check" | "x" | "minus" | "info" }> = {
  allowed: { label: "مجاز", className: "text-pos bg-pos/10 border-pos/20", icon: "check" },
  restricted: { label: "با محدودیت", className: "text-warn bg-warn/10 border-warn/20", icon: "minus" },
  "not-allowed": { label: "ممنوع", className: "text-neg bg-neg/10 border-neg/20", icon: "x" },
  unknown: { label: "نامشخص", className: "text-muted bg-surface border-line", icon: "info" },
};

export function RuleBadge({ rule, className }: { rule: RuleDetail | RuleStatus; className?: string }) {
  const status = typeof rule === "string" ? rule : rule.status;
  const m = RULE_META[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium", m.className, className)} title={typeof rule === "string" ? undefined : rule.note}>
      <Icon name={m.icon} size={12} strokeWidth={2.4} />
      {m.label}
    </span>
  );
}

const REVIEW_META: Record<ReviewStatus, { label: string; className: string }> = {
  reviewed: { label: "بررسی‌شده", className: "text-pos border-pos/25 bg-pos/10" },
  "in-review": { label: "در حال بررسی", className: "text-warn border-warn/25 bg-warn/10" },
  outdated: { label: "نیازمند بروزرسانی", className: "text-neg border-neg/25 bg-neg/10" },
};

export function ReviewBadge({ status }: { status: ReviewStatus }) {
  const m = REVIEW_META[status];
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium", m.className)}>{m.label}</span>;
}

export function ReviewedAt({ firm, className }: { firm: Pick<PropFirm, "lastReviewedAt">; className?: string }) {
  return (
    <p className={cn("text-xs text-muted", className)}>
      آخرین بررسی قوانین: <time dateTime={firm.lastReviewedAt} className="text-fg/80">{formatJalaliDate(firm.lastReviewedAt)}</time>
    </p>
  );
}

export const pct = (v: number | null) => (v === null ? "—" : `${v}%`);
export const feeLabel = (f: PropFirm) => `${formatMoney(f.challengeFee.fee, f.challengeFee.currency, 0)}`;
export const sizeLabel = (n: number) => `$${n >= 1000 ? `${n / 1000}K` : n}`;
export const daysLabel = (d: number | null) => (d === null ? "—" : d === 0 ? "ندارد" : `${toFaDigits(d)} روز`);
export const splitLabel = (f: PropFirm) => (f.profitSplit.base === f.profitSplit.max ? `${f.profitSplit.base}%` : `${f.profitSplit.base}% → ${f.profitSplit.max}%`);
