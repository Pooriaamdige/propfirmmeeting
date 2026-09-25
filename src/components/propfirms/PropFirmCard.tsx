import Link from "next/link";
import type { PropFirm } from "@/lib/types";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { CompareButton } from "./CompareButton";
import { FirmLogo, ReviewBadge, ReviewedAt, RuleBadge, daysLabel, feeLabel, pct, sizeLabel, splitLabel } from "./shared";

function Stat({ label, labelEn, children }: { label: string; labelEn: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface/70 px-3 py-2.5">
      <dt className="flex items-baseline justify-between gap-1 text-[11px] text-muted">
        {label}
        <span className="latin text-[10px] text-faint">{labelEn}</span>
      </dt>
      <dd className="mt-1 text-sm font-semibold">{children}</dd>
    </div>
  );
}

export function PropFirmCard({ firm }: { firm: PropFirm }) {
  return (
    <article className="card group flex h-full flex-col p-5 transition duration-300 hover:-translate-y-0.5 hover:border-line-strong" aria-labelledby={`firm-${firm.slug}`}>
      <header className="flex items-start gap-3">
        <FirmLogo firm={firm} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={`firm-${firm.slug}`} className="latin text-lg font-bold">
              {firm.name}
            </h3>
            <ReviewBadge status={firm.status} />
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">
            <span className="latin">{firm.program}</span>
            {firm.country && <> · {firm.country}</>}
          </p>
        </div>
      </header>

      <dl className="mt-5 grid grid-cols-2 gap-2">
        <Stat label="هزینه چالش" labelEn={sizeLabel(firm.challengeFee.accountSize)}>
          <span className="num">{feeLabel(firm)}</span>
        </Stat>
        <Stat label="تقسیم سود" labelEn="Split">
          <span className="num">{splitLabel(firm)}</span>
        </Stat>
        <Stat label="دراداون روزانه" labelEn="Daily">
          <span className="num">{pct(firm.dailyDrawdown.value)}</span>
        </Stat>
        <Stat label="دراداون کلی" labelEn="Max">
          <span className="num">{pct(firm.maxDrawdown.value)}</span>
        </Stat>
        <Stat label="تارگت" labelEn="Target">
          <span className="num">
            {pct(firm.profitTarget.phase1)}
            {firm.profitTarget.phase2 !== null && ` / ${pct(firm.profitTarget.phase2)}`}
          </span>
        </Stat>
        <Stat label="حداقل روز" labelEn="Min days">
          {daysLabel(firm.minimumTradingDays)}
        </Stat>
      </dl>

      <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        {[
          ["News Trading", firm.newsTrading],
          ["Weekend", firm.weekendHolding],
          ["EA", firm.eaAllowed],
          ["Scaling", { status: firm.scalingRules.available ? "allowed" : "not-allowed", note: firm.scalingRules.note }],
        ].map(([label, rule]) => (
          <li key={label as string} className="flex items-center justify-between gap-2">
            <span className="latin text-muted">{label as string}</span>
            <RuleBadge rule={rule as PropFirm["newsTrading"]} />
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-muted">
        <span className="font-medium text-fg/80">برداشت:</span> {firm.payoutRules.frequency}
      </p>

      <div className="mt-auto pt-4">
        <ReviewedAt firm={firm} className="mb-3" />
        <div className="flex gap-2">
          <Link href={`/prop-firms/${firm.slug}/`} className={buttonClass("primary", "sm", "flex-1")}>
            مشاهده تحلیل
            <Icon name="arrow-left" size={15} className="transition-transform group-hover:-translate-x-0.5" />
          </Link>
          <CompareButton slug={firm.slug} name={firm.name} />
        </div>
      </div>
    </article>
  );
}
