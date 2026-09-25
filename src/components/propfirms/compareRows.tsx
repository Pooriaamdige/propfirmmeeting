import type { ReactNode } from "react";
import type { PropFirm } from "@/lib/types";
import { RuleBadge, daysLabel, feeLabel, pct, sizeLabel, splitLabel } from "./shared";

export interface CompareRow {
  id: string;
  label: string;
  labelEn: string;
  render: (f: PropFirm) => ReactNode;
  /** Numeric value used for sorting/highlighting; lower-is-better when `better` = "low". */
  value?: (f: PropFirm) => number | null;
  better?: "low" | "high";
}

const ruleScore = (s: string) => (s === "allowed" ? 2 : s === "restricted" ? 1 : 0);

export const COMPARE_ROWS: CompareRow[] = [
  { id: "fee", label: "هزینه چالش", labelEn: "Challenge Fee", render: (f) => <span className="num">{feeLabel(f)} <span className="text-faint">/ {sizeLabel(f.challengeFee.accountSize)}</span></span>, value: (f) => f.challengeFee.fee / f.challengeFee.accountSize * (f.challengeFee.currency === "EUR" ? 1.08 : 1), better: "low" },
  { id: "target", label: "تارگت سود", labelEn: "Profit Target", render: (f) => <span className="num">{pct(f.profitTarget.phase1)}{f.profitTarget.phase2 !== null && ` / ${pct(f.profitTarget.phase2)}`}</span>, value: (f) => (f.profitTarget.phase1 ?? 0) + (f.profitTarget.phase2 ?? 0), better: "low" },
  { id: "daily", label: "دراداون روزانه", labelEn: "Daily Drawdown", render: (f) => <span className="num">{pct(f.dailyDrawdown.value)}</span>, value: (f) => f.dailyDrawdown.value, better: "high" },
  { id: "max", label: "دراداون کلی", labelEn: "Max Drawdown", render: (f) => <span><span className="num">{pct(f.maxDrawdown.value)}</span> <span className="latin text-[11px] text-faint">{f.maxDrawdown.type}</span></span>, value: (f) => f.maxDrawdown.value, better: "high" },
  { id: "split", label: "تقسیم سود", labelEn: "Profit Split", render: (f) => <span className="num">{splitLabel(f)}</span>, value: (f) => f.profitSplit.max, better: "high" },
  { id: "leverage", label: "لوریج", labelEn: "Leverage", render: (f) => <span className="num">{f.leverage.forex}</span>, value: (f) => Number(f.leverage.forex.split(":")[1]), better: "high" },
  { id: "days", label: "حداقل روز معاملاتی", labelEn: "Minimum Days", render: (f) => daysLabel(f.minimumTradingDays), value: (f) => f.minimumTradingDays, better: "low" },
  { id: "news", label: "معامله در اخبار", labelEn: "News Trading", render: (f) => <RuleBadge rule={f.newsTrading} />, value: (f) => ruleScore(f.newsTrading.status), better: "high" },
  { id: "weekend", label: "نگه‌داشتن آخر هفته", labelEn: "Weekend", render: (f) => <RuleBadge rule={f.weekendHolding} />, value: (f) => ruleScore(f.weekendHolding.status), better: "high" },
  { id: "ea", label: "اکسپرت", labelEn: "EA", render: (f) => <RuleBadge rule={f.eaAllowed} />, value: (f) => ruleScore(f.eaAllowed.status), better: "high" },
  { id: "payout", label: "برداشت سود", labelEn: "Payout", render: (f) => <span className="text-xs leading-5">{f.payoutRules.frequency}</span> },
  { id: "refund", label: "بازگشت هزینه", labelEn: "Refund", render: (f) => <RuleBadge rule={f.refundPolicy.available ? "allowed" : "not-allowed"} /> },
  { id: "scaling", label: "افزایش سرمایه", labelEn: "Scaling", render: (f) => <RuleBadge rule={f.scalingRules.available ? "allowed" : "not-allowed"} /> },
];
