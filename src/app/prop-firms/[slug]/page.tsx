import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPropFirm, getPropFirmSlugs } from "@/lib/services/propFirmService";
import type { PropFirm, RuleDetail } from "@/lib/types";
import { formatJalaliDate, formatMoney, toFaDigits } from "@/lib/format";
import { absoluteUrl } from "@/lib/site";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { JsonLd, breadcrumbLd } from "@/components/seo/JsonLd";
import { CompareButton } from "@/components/propfirms/CompareButton";
import { FirmLogo, ReviewBadge, RuleBadge, daysLabel, pct, sizeLabel, splitLabel } from "@/components/propfirms/shared";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getPropFirmSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/prop-firms/[slug]">): Promise<Metadata> {
  const firm = await getPropFirm((await params).slug);
  if (!firm) return {};
  const title = `بررسی ${firm.name}: قوانین، دراداون، هزینه چالش و تقسیم سود`;
  return {
    title,
    description: `تحلیل ${firm.name} (${firm.program}): هزینه چالش ${formatMoney(firm.challengeFee.fee, firm.challengeFee.currency, 0)}، تارگت ${firm.profitTarget.phase1}%، دراداون روزانه ${firm.dailyDrawdown.value}% و کلی ${firm.maxDrawdown.value}%، تقسیم سود تا ${firm.profitSplit.max}%.`,
    alternates: { canonical: `/prop-firms/${firm.slug}/` },
    openGraph: { type: "article", url: `/prop-firms/${firm.slug}/`, title, modifiedTime: firm.lastReviewedAt },
  };
}

function QuickCard({ label, labelEn, value, sub }: { label: string; labelEn: string; value: string; sub?: React.ReactNode }) {
  return (
    <div className="card p-4">
      <p className="flex items-baseline justify-between gap-2 text-xs text-muted">
        {label}
        <span className="latin text-[10px] text-faint">{labelEn}</span>
      </p>
      <p className="num mt-2 text-xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-[11px] leading-5 text-faint">{sub}</p>}
    </div>
  );
}

function RuleRow({ title, titleEn, rule, badge }: { title: string; titleEn: string; rule: RuleDetail; badge?: string }) {
  return (
    <div className="grid gap-2 py-4 sm:grid-cols-[180px_110px_1fr] sm:items-start sm:gap-4">
      <p className="font-medium">
        {title}
        <span className="latin block text-[11px] font-normal text-faint">{titleEn}</span>
      </p>
      <div>{badge ? <span className="num inline-flex rounded-md border border-line-strong bg-surface px-2 py-0.5 text-xs font-semibold">{badge}</span> : <RuleBadge rule={rule} />}</div>
      <p className="text-sm leading-7 text-muted">{rule.note}</p>
    </div>
  );
}

function rulesOf(f: PropFirm): { title: string; titleEn: string; rule: RuleDetail; badge?: string }[] {
  return [
    { title: "دراداون روزانه", titleEn: "Daily Drawdown", badge: `${f.dailyDrawdown.value}%`, rule: { status: "restricted", note: f.dailyDrawdown.basis } },
    { title: "دراداون کلی", titleEn: "Maximum Drawdown", badge: `${f.maxDrawdown.value}% ${f.maxDrawdown.type}`, rule: { status: "restricted", note: f.maxDrawdown.basis } },
    { title: "قانون ثبات", titleEn: "Consistency Rule", rule: f.consistencyRule },
    { title: "معامله در زمان اخبار", titleEn: "News Trading", rule: f.newsTrading },
    { title: "نگه‌داشتن آخر هفته", titleEn: "Weekend Holding", rule: f.weekendHolding },
    { title: "نگه‌داشتن شبانه", titleEn: "Overnight", rule: f.overnightHolding },
    { title: "اکسپرت", titleEn: "EA", rule: f.eaAllowed },
    { title: "کپی ترید", titleEn: "Copy Trading", rule: f.copyTrading },
    { title: "هج", titleEn: "Hedging", rule: f.hedging },
    { title: "قوانین IP", titleEn: "IP Rules", rule: f.ipRules },
    { title: "VPN / VPS", titleEn: "VPN/VPS", rule: f.vpnVps },
    { title: "قوانین برداشت", titleEn: "Payout Rules", rule: { status: "allowed", note: `اولین برداشت: ${f.payoutRules.firstPayout}. دوره: ${f.payoutRules.frequency}. روش‌ها: ${f.payoutRules.methods.join("، ")}. ${f.payoutRules.note}` } },
  ];
}

export default async function PropFirmPage({ params }: PageProps<"/prop-firms/[slug]">) {
  const firm = await getPropFirm((await params).slug);
  if (!firm) notFound();
  const url = absoluteUrl(`/prop-firms/${firm.slug}/`);

  return (
    <article>
      <JsonLd
        data={[
          breadcrumbLd([
            { name: "خانه", url: absoluteUrl("/") },
            { name: "پراپ‌فرم‌ها", url: absoluteUrl("/prop-firms/") },
            { name: firm.name, url },
          ]),
          { "@context": "https://schema.org", "@type": "Organization", name: firm.name, url: firm.website, foundingDate: firm.foundedYear ? String(firm.foundedYear) : undefined },
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: `بررسی ${firm.name}`,
            inLanguage: "fa-IR",
            dateModified: firm.lastReviewedAt,
            mainEntityOfPage: url,
            about: { "@type": "Organization", name: firm.name, url: firm.website },
          },
          ...(firm.faq.length
            ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: firm.faq.map((q) => ({ "@type": "Question", name: q.question, acceptedAnswer: { "@type": "Answer", text: q.answer } })) }]
            : []),
        ]}
      />

      {/* Header */}
      <header className="relative overflow-hidden border-b border-line">
        <div className="grid-bg fade-mask-b pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          <nav aria-label="مسیر صفحه" className="mb-8 text-xs text-muted">
            <ol className="flex items-center gap-1.5">
              <li><Link href="/" className="hover:text-fg">خانه</Link></li>
              <li aria-hidden>/</li>
              <li><Link href="/prop-firms/" className="hover:text-fg">پراپ‌فرم‌ها</Link></li>
              <li aria-hidden>/</li>
              <li aria-current="page" className="latin text-fg">{firm.name}</li>
            </ol>
          </nav>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              <FirmLogo firm={firm} size={64} />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="latin text-3xl font-black md:text-4xl">{firm.name}</h1>
                  <ReviewBadge status={firm.status} />
                </div>
                <p className="mt-2 text-sm text-muted">
                  <span className="latin">{firm.program}</span>
                  {firm.country && <> · ثبت: {firm.country}</>}
                  {firm.foundedYear && <> · تأسیس {toFaDigits(firm.foundedYear)}</>}
                </p>
                <p className="mt-2 text-sm">
                  آخرین بررسی: <time dateTime={firm.lastReviewedAt} className="font-semibold">{formatJalaliDate(firm.lastReviewedAt)}</time>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <CompareButton slug={firm.slug} name={firm.name} size="md" />
              <a href={firm.website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex h-10 items-center gap-2 rounded-lg border border-line-strong px-4 text-sm hover:border-accent/50">
                وب‌سایت رسمی
                <Icon name="external" size={15} />
              </a>
            </div>
          </div>
          <p className="mt-6 max-w-3xl leading-8 text-muted">{firm.description}</p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
        {/* Quick facts */}
        <section aria-labelledby="facts">
          <h2 id="facts" className="mb-5 text-xl font-bold">اطلاعات سریع</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <QuickCard label="هزینه چالش" labelEn="Challenge Fee" value={formatMoney(firm.challengeFee.fee, firm.challengeFee.currency, 0)} sub={<>حساب <span className="num">{sizeLabel(firm.challengeFee.accountSize)}</span></>} />
            <QuickCard label="تارگت سود" labelEn="Profit Target" value={`${pct(firm.profitTarget.phase1)}${firm.profitTarget.phase2 !== null ? ` / ${pct(firm.profitTarget.phase2)}` : ""}`} sub="مرحله ۱ / مرحله ۲" />
            <QuickCard label="دراداون روزانه" labelEn="Daily Drawdown" value={pct(firm.dailyDrawdown.value)} sub={firm.dailyDrawdown.basis} />
            <QuickCard label="دراداون کلی" labelEn="Maximum Drawdown" value={pct(firm.maxDrawdown.value)} sub={firm.maxDrawdown.basis} />
            <QuickCard label="تقسیم سود" labelEn="Profit Split" value={splitLabel(firm)} />
            <QuickCard label="حداقل روز معاملاتی" labelEn="Min Trading Days" value={daysLabel(firm.minimumTradingDays)} />
            <QuickCard label="لوریج" labelEn="Leverage" value={firm.leverage.forex} sub={<>فلزات: <span className="num">{firm.leverage.metals}</span></>} />
            <QuickCard label="بازگشت هزینه" labelEn="Refund" value={firm.refundPolicy.available ? "دارد" : "ندارد"} sub={firm.refundPolicy.note} />
          </div>
          {firm.feeTiers.length > 1 && (
            <div className="card scrollbar-thin mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <caption className="px-4 pt-3 text-start text-xs text-muted">هزینه چالش بر اساس سایز حساب</caption>
                <tbody>
                  <tr className="border-b border-line">
                    <th scope="row" className="px-4 py-2.5 text-start text-xs font-medium text-muted">سایز حساب</th>
                    {firm.feeTiers.map((t) => <td key={t.accountSize} className="num px-4 py-2.5 font-semibold">{sizeLabel(t.accountSize)}</td>)}
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-2.5 text-start text-xs font-medium text-muted">هزینه</th>
                    {firm.feeTiers.map((t) => <td key={t.accountSize} className="num px-4 py-2.5">{formatMoney(t.fee, t.currency)}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Challenge steps */}
        <section aria-labelledby="steps">
          <h2 id="steps" className="mb-5 text-xl font-bold">مراحل چالش</h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {firm.phases.map((p, i) => {
              const funded = p.profitTarget === null;
              return (
                <Reveal as="li" key={p.name} delay={i * 100} className="relative">
                  <div className={`card h-full p-5 ${funded ? "border-accent/40" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${funded ? "bg-accent text-accent-contrast" : "bg-surface"}`}>{funded ? <Icon name="check" size={16} /> : toFaDigits(i + 1)}</span>
                      <span className="latin text-xs text-muted">{funded ? "Funded" : `Step ${i + 1}`}</span>
                    </div>
                    <h3 className="latin mt-4 font-bold">{p.name}</h3>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div><dt className="text-xs text-muted">تارگت</dt><dd className="num mt-0.5 font-semibold">{funded ? "—" : pct(p.profitTarget)}</dd></div>
                      <div><dt className="text-xs text-muted">دراداون روزانه / کلی</dt><dd className="num mt-0.5 font-semibold">{p.dailyDrawdown}% / {p.maxDrawdown}%</dd></div>
                      <div><dt className="text-xs text-muted">حداقل روز</dt><dd className="mt-0.5 font-semibold">{daysLabel(p.minTradingDays)}</dd></div>
                      <div><dt className="text-xs text-muted">محدودیت زمانی</dt><dd className="mt-0.5 font-semibold">{p.timeLimit}</dd></div>
                    </dl>
                  </div>
                </Reveal>
              );
            })}
          </ol>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted">
            {firm.phases.map((p, i) => (
              <span key={p.name} className="inline-flex items-center gap-2">
                <span className="latin">{p.name}</span>
                {i < firm.phases.length - 1 && <Icon name="arrow-left" size={14} className="text-accent" />}
              </span>
            ))}
          </p>
        </section>

        {/* Rules */}
        <section aria-labelledby="rules">
          <h2 id="rules" className="mb-2 text-xl font-bold">قوانین</h2>
          <p className="mb-4 text-sm text-muted">خلاصه قوانین کلیدی؛ متن کامل را در صفحه رسمی بخوانید.</p>
          <div className="card divide-y divide-line px-5">
            {rulesOf(firm).map((r) => (
              <RuleRow key={r.titleEn} {...r} />
            ))}
          </div>
        </section>

        {/* Pros / limits */}
        <section aria-labelledby="pros" className="grid gap-4 md:grid-cols-2">
          <h2 id="pros" className="sr-only">مزایا و محدودیت‌ها</h2>
          <div className="card p-6">
            <h3 className="flex items-center gap-2 font-bold"><Icon name="check" className="text-pos" />موارد قابل توجه</h3>
            <ul className="mt-4 space-y-3 text-sm leading-7">
              {firm.highlights.map((h) => <li key={h} className="flex gap-2"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-pos" aria-hidden />{h}</li>)}
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="flex items-center gap-2 font-bold"><Icon name="alert" className="text-warn" />محدودیت‌ها و قوانین مهم</h3>
            <ul className="mt-4 space-y-3 text-sm leading-7">
              {firm.limitations.map((h) => <li key={h} className="flex gap-2"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" aria-hidden />{h}</li>)}
            </ul>
          </div>
        </section>

        {/* Access note */}
        <section aria-labelledby="access" className="rounded-xl border border-warn/25 bg-warn/5 p-5">
          <h2 id="access" className="flex items-center gap-2 font-bold"><Icon name="globe" className="text-warn" />دسترسی برای کاربران ایرانی</h2>
          <p className="mt-2 text-sm leading-7 text-muted">{firm.accessNote}</p>
        </section>

        {/* FAQ */}
        {firm.faq.length > 0 && (
          <section aria-labelledby="faq">
            <h2 id="faq" className="mb-4 text-xl font-bold">سؤالات متداول</h2>
            <div className="space-y-2">
              {firm.faq.map((q) => (
                <details key={q.question} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 font-medium">
                    {q.question}
                    <Icon name="chevron-down" className="shrink-0 transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm leading-7 text-muted">{q.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* Last review */}
        <section aria-labelledby="updated" className="card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="updated" className="font-bold">آخرین بروزرسانی</h2>
            <p className="mt-1 text-sm text-muted">
              آخرین بررسی قوانین: <time dateTime={firm.lastReviewedAt} className="text-fg">{formatJalaliDate(firm.lastReviewedAt)}</time> · وضعیت: <ReviewBadge status={firm.status} />
            </p>
          </div>
          <ul className="flex flex-wrap gap-3 text-sm">
            {firm.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="latin inline-flex items-center gap-1.5 text-accent hover:underline">
                  {s.label}
                  <Icon name="external" size={13} />
                </a>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <LinkButton href={`/compare/?firms=${firm.slug}`} variant="secondary">مقایسه با سایر پراپ‌فرم‌ها</LinkButton>
          <LinkButton href="/tools/#drawdown" variant="ghost">محاسبه دراداون برای این حساب</LinkButton>
        </div>
      </div>
    </article>
  );
}
