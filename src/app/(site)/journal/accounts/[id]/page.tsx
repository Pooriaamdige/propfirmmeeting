import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/user-session";
import { accountStats, getAccount, getTrades, getTransactions, type TradeFilters } from "@/lib/journal/service";
import { netOf, type JournalStats, type RuleCheck } from "@/lib/journal/analytics";
import { buildInsights } from "@/lib/journal/insights";
import { ACCOUNT_TYPES, EMOTIONS, SESSION_LABELS, WEEKDAY_LABELS } from "@/lib/journal/instruments";
import { fmtDateTime, fmtDuration, fmtMoney, fmtNum, fmtPct, toneOf } from "@/lib/journal/format";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/States";
import { Card, Crumbs, RuleStatusBadge, StatTile } from "@/components/journal/ui";
import { BreakdownTable } from "@/components/journal/Breakdown";
import { Meter, PolarityBars } from "@/components/journal/charts";
import { CalendarPanel, EquityPanel } from "@/components/journal/panels";
import { TransactionForm } from "@/components/journal/TransactionForm";
import { ConfirmButton } from "@/components/admin/client";
import { deleteTransactionAction } from "../../actions";

export const metadata: Metadata = { title: "داشبورد ژورنال", robots: { index: false } };

const TABS = [
  ["overview", "نمای کلی"],
  ["trades", "معاملات"],
  ["analysis", "تحلیل"],
  ["rules", "قوانین پراپ"],
  ["cash", "واریز / برداشت"],
] as const;
type Tab = (typeof TABS)[number][0];

const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function AccountDashboard({ params, searchParams }: PageProps<"/journal/accounts/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const user = await requireUser(`/journal/accounts/${id}/`);
  const account = await getAccount(user.id, Number(id));
  if (!account) notFound();

  const tab = (TABS.find(([t]) => t === sp.tab)?.[0] ?? "overview") as Tab;
  const filters: TradeFilters = {
    from: str(sp.from)?.match(/^\d{4}-\d{2}-\d{2}$/) ? str(sp.from) : undefined,
    to: str(sp.to)?.match(/^\d{4}-\d{2}-\d{2}$/) ? str(sp.to) : undefined,
    symbol: str(sp.symbol) || undefined,
    side: sp.side === "buy" || sp.side === "sell" ? sp.side : undefined,
    setup: str(sp.setup) || undefined,
  };
  const filtered = Object.values(filters).some(Boolean);
  const [allTrades, trades, txs] = await Promise.all([getTrades(user.id, account.id), getTrades(user.id, account.id, filters), getTransactions(user.id, account.id)]);
  const stats = await accountStats(account, trades, filtered ? [] : txs);
  const c = account.currency;
  const symbols = [...new Set(allTrades.map((t) => t.symbol))].sort();
  const setups = [...new Set(allTrades.map((t) => t.setup).filter(Boolean))].sort();
  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...filters, ...extra })) if (v) p.set(k, String(v));
    return `?${p.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Crumbs items={[{ href: "/journal/", label: "ژورنال" }, { label: account.name }]} />
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black md:text-3xl">{account.name}</h1>
            <RuleStatusBadge status={stats.ruleStatus} />
            {account.archived && <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">بایگانی</span>}
          </div>
          <p className="mt-1 text-sm text-muted">
            {ACCOUNT_TYPES.find((t) => t.id === account.type)?.label}
            {account.firmName && <span className="latin"> · {account.firmName}</span>}
            {account.platform && <span className="latin"> · {account.platform}</span>} · بالانس اولیه <span className="num">{fmtMoney(account.initialBalance, c)}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/journal/accounts/${account.id}/trades/new/`} className={buttonClass("primary")}>
            <Icon name="plus" size={16} /> ثبت معامله
          </Link>
          <Link href={`/journal/accounts/${account.id}/import/`} className={buttonClass("secondary")}>
            <Icon name="download" size={15} className="rotate-180" /> وارد کردن CSV
          </Link>
          <a href={`/journal/accounts/${account.id}/export/`} className={buttonClass("ghost")} aria-label="خروجی CSV">
            <Icon name="download" size={15} />
          </a>
          <Link href={`/journal/accounts/${account.id}/edit/`} className={buttonClass("ghost")} aria-label="ویرایش حساب">
            <Icon name="edit" size={15} />
          </Link>
        </div>
      </div>

      {(sp.saved === "1" || sp.imported) && (
        <p role="status" className="mt-4 rounded-lg border border-pos/30 bg-pos/5 px-3 py-2 text-sm text-pos">
          {sp.imported ? `${Number(sp.imported).toLocaleString("fa-IR")} معامله وارد شد${Number(sp.skipped) ? ` (${Number(sp.skipped).toLocaleString("fa-IR")} ردیف نامعتبر رد شد)` : ""}.` : "معامله ذخیره شد."}
        </p>
      )}

      {/* Tabs */}
      <nav className="scrollbar-thin -mx-4 mt-6 flex gap-1 overflow-x-auto border-b border-line px-4" aria-label="بخش‌های داشبورد">
        {TABS.map(([t, label]) => (
          <Link key={t} href={qs({ tab: t })} aria-current={tab === t ? "page" : undefined} className={cn("relative shrink-0 px-4 py-3 text-sm transition", tab === t ? "font-semibold text-fg" : "text-muted hover:text-fg")}>
            {label}
            {tab === t && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" aria-hidden />}
          </Link>
        ))}
      </nav>

      {/* Filters */}
      {tab !== "cash" && tab !== "rules" && (
        <form className="mt-4 flex flex-wrap items-end gap-2 text-sm" aria-label="فیلتر معاملات">
          <input type="hidden" name="tab" value={tab} />
          <label className="flex flex-col gap-1 text-xs text-muted">
            از
            <input type="date" name="from" defaultValue={filters.from} className="h-9 rounded-lg border border-line bg-card px-2 text-sm text-fg" dir="ltr" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            تا
            <input type="date" name="to" defaultValue={filters.to} className="h-9 rounded-lg border border-line bg-card px-2 text-sm text-fg" dir="ltr" />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            نماد
            <select name="symbol" defaultValue={filters.symbol ?? ""} className="h-9 rounded-lg border border-line bg-card px-2 text-sm text-fg">
              <option value="">همه</option>
              {symbols.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            جهت
            <select name="side" defaultValue={filters.side ?? ""} className="h-9 rounded-lg border border-line bg-card px-2 text-sm text-fg">
              <option value="">همه</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </label>
          {setups.length > 0 && (
            <label className="flex flex-col gap-1 text-xs text-muted">
              ستاپ
              <select name="setup" defaultValue={filters.setup ?? ""} className="h-9 rounded-lg border border-line bg-card px-2 text-sm text-fg">
                <option value="">همه</option>
                {setups.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          )}
          <button className={buttonClass("secondary", "sm", "h-9")}>اعمال</button>
          {filtered && (
            <Link href={`?tab=${tab}`} className="h-9 px-2 leading-9 text-xs text-muted hover:text-fg">
              حذف فیلتر
            </Link>
          )}
        </form>
      )}

      <div className="mt-6">
        {allTrades.length === 0 && tab !== "cash" ? (
          <EmptyState
            icon="book"
            title="هنوز معامله‌ای ثبت نشده است."
            description="اولین معامله را ثبت کن یا تاریخچه معاملاتت را با فایل CSV وارد کن."
            action={
              <div className="flex gap-2">
                <Link href={`/journal/accounts/${account.id}/trades/new/`} className={buttonClass("primary")}>
                  ثبت معامله
                </Link>
                <Link href={`/journal/accounts/${account.id}/import/`} className={buttonClass("secondary")}>
                  وارد کردن CSV
                </Link>
              </div>
            }
          />
        ) : tab === "overview" ? (
          <Overview stats={stats} currency={c} initial={account.initialBalance} filtered={filtered} />
        ) : tab === "trades" ? (
          <TradesTab trades={trades} currency={c} status={str(sp.status)} qs={qs} />
        ) : tab === "analysis" ? (
          <Analysis stats={stats} currency={c} />
        ) : tab === "rules" ? (
          <Rules stats={stats} currency={c} accountId={account.id} hasRules={!!account.rules} />
        ) : (
          <Cash accountId={account.id} currency={c} txs={txs} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Overview ------------------------------- */

function Overview({ stats: s, currency: c, initial, filtered }: { stats: JournalStats; currency: string; initial: number; filtered: boolean }) {
  const insights = buildInsights(s);
  const z = s.zScore;
  return (
    <div className="space-y-6">
      {filtered && <p className="text-xs text-muted">آمار فقط برای معاملات فیلترشده محاسبه شده است (واریز/برداشت لحاظ نشده).</p>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="card border-beam p-5 sm:col-span-2">
          <p className="text-xs text-muted">بالانس</p>
          <p className="num mt-1 text-4xl font-black">{fmtMoney(s.balance, c)}</p>
          <p className={cn("num mt-1 text-sm font-semibold", toneOf(s.netProfit))}>
            {fmtMoney(s.netProfit, c, true)} · {fmtPct(s.gainPct)}
          </p>
        </div>
        <StatTile label="رشد (Gain)" value={fmtPct(s.gainPct)} tone={s.gainPct >= 0 ? "pos" : "neg"} hint="بازده زمان‌وزنی؛ واریز و برداشت روی آن اثر ندارد" sub={`مطلق: ${fmtPct(s.absGainPct)}`} />
        <StatTile label="حداکثر دراداون" value={fmtPct(-s.maxDrawdownPct, false)} tone={s.maxDrawdownPct > 0 ? "neg" : undefined} sub={fmtMoney(-s.maxDrawdownAmount, c)} />
        <StatTile label="نرخ برد" value={`${fmtNum(s.winRate, 1)}%`} sub={`${s.trades.wins} برد · ${s.trades.losses} باخت`} />
        <StatTile label="Profit Factor" value={s.profitFactor === null ? "∞" : fmtNum(s.profitFactor)} hint="مجموع سود ÷ مجموع زیان؛ بالای ۱٫۵ خوب است" sub={`Expectancy ${fmtMoney(s.expectancy, c, true)}`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card title="منحنی حساب">
          <EquityPanel curve={s.curve} currency={c} initial={initial} />
        </Card>
        <Card title="تقویم سود و زیان">
          <CalendarPanel days={s.daily} currency={c} />
        </Card>
      </div>

      {insights.length > 0 && (
        <Card title="نکات کلیدی از معاملات تو">
          <ul className="space-y-2.5 text-sm leading-7">
            {insights.map((i) => (
              <li key={i.text} className="flex gap-2.5">
                <Icon name={i.tone === "pos" ? "check" : i.tone === "neg" ? "alert" : "info"} size={16} className={cn("mt-1.5 shrink-0", i.tone === "pos" ? "text-pos" : i.tone === "neg" ? "text-neg" : "text-accent-2")} />
                {i.text}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="آمار پیشرفته">
          <dl className="grid grid-cols-1 gap-x-8 text-sm sm:grid-cols-2">
            {(
              [
                ["معاملات (بسته / باز)", `${s.trades.closed} / ${s.trades.open}`],
                ["مجموع پیپ", fmtNum(s.totalPips, 1)],
                ["میانگین برد", `${fmtMoney(s.avgWin, c)} · ${fmtNum(s.avgWinPips, 1)} پیپ`],
                ["میانگین باخت", `${fmtMoney(s.avgLoss, c)} · ${fmtNum(s.avgLossPips, 1)} پیپ`],
                ["نسبت برد به باخت (Payoff)", s.payoffRatio === null ? "—" : fmtNum(s.payoffRatio)],
                ["مجموع لات", fmtNum(s.totalLots)],
                ["کمیسیون / سواپ", `${fmtMoney(-s.commission, c)} / ${fmtMoney(s.swap, c)}`],
                ["Long (برد)", `${s.longs.trades} (${fmtNum(s.longs.winRate, 1)}%)`],
                ["Short (برد)", `${s.shorts.trades} (${fmtNum(s.shorts.winRate, 1)}%)`],
                ["بهترین معامله", s.bestTrade ? fmtMoney(s.bestTrade.net, c, true) : "—"],
                ["بدترین معامله", s.worstTrade ? fmtMoney(s.worstTrade.net, c, true) : "—"],
                ["میانگین مدت معامله", fmtDuration(s.avgHoldMinutes)],
                ["مدت معاملات برنده / بازنده", `${fmtDuration(s.avgHoldWinMinutes)} / ${fmtDuration(s.avgHoldLossMinutes)}`],
                ["بیشترین برد پیاپی", `${s.maxConsecutiveWins} (${fmtMoney(s.maxConsecutiveProfit, c)})`],
                ["بیشترین باخت پیاپی", `${s.maxConsecutiveLosses} (${fmtMoney(s.maxConsecutiveLoss, c)})`],
                ["روزهای معاملاتی", String(s.tradingDays)],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 border-b border-line py-2">
                <dt className="text-muted">{k}</dt>
                <dd className="num text-end font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card title="شاخص‌های ریسک و کیفیت">
          <dl className="grid grid-cols-1 gap-x-8 text-sm sm:grid-cols-2">
            {(
              [
                ["میانگین R", s.avgR === null ? "—" : `${s.avgR >= 0 ? "+" : ""}${fmtNum(s.avgR)}R`, "میانگین نتیجه هر معامله بر حسب ریسک اولیه"],
                ["مجموع R", s.totalR === null ? "—" : `${fmtNum(s.totalR)}R`, `${s.rTrades} معامله با ریسک مشخص`],
                ["Sharpe (هر معامله)", fmtNum(s.sharpe), "میانگین بازده ÷ انحراف معیار بازده"],
                ["AHPR / GHPR", `${fmtNum(s.ahpr, 3)}% / ${fmtNum(s.ghpr, 3)}%`, "میانگین حسابی و هندسی بازده هر معامله"],
                ["انحراف معیار بازده", `${fmtNum(s.stdDevReturnPct, 3)}%`, ""],
                ["Z-Score", z === null ? "—" : fmtNum(z), z === null ? "" : Math.abs(z) > 1.96 ? "وابستگی معنادار بین نتایج پیاپی" : "نتایج پیاپی تقریباً مستقل‌اند"],
                ["Kelly", s.kellyPct === null ? "—" : `${fmtNum(s.kellyPct, 1)}%`, "سقف نظری ریسک؛ معمولاً کسری از آن استفاده می‌شود"],
                ["Recovery Factor", fmtNum(s.recoveryFactor), "سود خالص ÷ حداکثر دراداون"],
              ] as const
            ).map(([k, v, h]) => (
              <div key={k} className="border-b border-line py-2" title={h}>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted">{k}</dt>
                  <dd className="num font-medium">{v}</dd>
                </div>
                {h && <p className="mt-0.5 text-[11px] text-faint">{h}</p>}
              </div>
            ))}
          </dl>
        </Card>
      </div>

      <Card title="بازده ماهانه">
        <PolarityBars data={s.monthly.map((m) => ({ key: m.month, label: m.month.slice(2).replace("-", "/"), value: m.net, sub: `${fmtPct(m.gainPct)} · ${m.trades} معامله` }))} unit="money" currency={c} />
        <div className="scrollbar-thin mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] text-faint">
                <th className="py-2 text-start font-medium">ماه</th>
                <th className="py-2 text-start font-medium">معامله</th>
                <th className="py-2 text-start font-medium">سود/زیان</th>
                <th className="py-2 text-start font-medium">رشد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {s.monthly.map((m) => (
                <tr key={m.month}>
                  <td className="num py-2">{m.month}</td>
                  <td className="num py-2 text-muted">{m.trades}</td>
                  <td className={cn("num py-2 font-semibold", toneOf(m.net))}>{fmtMoney(m.net, c, true)}</td>
                  <td className={cn("num py-2", toneOf(m.gainPct))}>{fmtPct(m.gainPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* -------------------------------- Trades -------------------------------- */

function TradesTab({ trades, currency: c, status, qs }: { trades: Awaited<ReturnType<typeof getTrades>>; currency: string; status?: string; qs: (e: Record<string, string>) => string }) {
  const list = trades.filter((t) => {
    if (status === "open") return !t.closedAt;
    if (status === "win") return t.closedAt && netOf(t) > 0;
    if (status === "loss") return t.closedAt && netOf(t) < 0;
    return true;
  });
  const emo = (id: string) => EMOTIONS.find((e) => e.id === id)?.emoji ?? "";
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-1.5 text-sm">
        {(
          [
            ["", "همه"],
            ["win", "برنده"],
            ["loss", "بازنده"],
            ["open", "باز"],
          ] as const
        ).map(([k, label]) => (
          <Link key={k} href={qs({ tab: "trades", status: k })} className={cn("rounded-full border px-3 py-1 text-xs", (status ?? "") === k ? "border-accent/50 bg-accent/10 text-accent" : "border-line text-muted hover:text-fg")}>
            {label}
          </Link>
        ))}
        <span className="ms-auto self-center text-xs text-muted">{list.length.toLocaleString("fa-IR")} معامله</span>
      </div>
      <div className="card scrollbar-thin overflow-x-auto [contain:paint]">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] text-faint">
              {["زمان باز شدن", "نماد", "جهت", "لات", "ورود → خروج", "پیپ", "سود/زیان خالص", "R", "ستاپ و تگ", ""].map((h, i) => (
                <th key={i} className="px-3 py-2.5 text-start font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((t) => {
              const net = netOf(t);
              const r = t.closedAt && t.riskAmount ? net / t.riskAmount : null;
              return (
                <tr key={t.id} className="transition-colors hover:bg-surface/50">
                  <td className="num px-3 py-2.5 text-xs text-muted">{fmtDateTime(t.openedAt)}</td>
                  <td className="latin px-3 py-2.5 font-semibold">{t.symbol}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("latin rounded px-1.5 py-0.5 text-[11px] font-bold", t.side === "buy" ? "bg-pos/10 text-pos" : "bg-neg/10 text-neg")}>{t.side.toUpperCase()}</span>
                  </td>
                  <td className="num px-3 py-2.5">{fmtNum(t.lots)}</td>
                  <td className="num px-3 py-2.5 text-xs">
                    {fmtNum(t.entryPrice, 5)} → {t.exitPrice !== null ? fmtNum(t.exitPrice, 5) : "…"}
                  </td>
                  <td className={cn("num px-3 py-2.5", toneOf(t.pips ?? 0))}>{fmtNum(t.pips, 1)}</td>
                  <td className={cn("num px-3 py-2.5 font-semibold", t.closedAt ? toneOf(net) : "text-muted")}>{t.closedAt ? fmtMoney(net, c, true) : "باز"}</td>
                  <td className={cn("num px-3 py-2.5", r === null ? "text-faint" : toneOf(r))}>{r === null ? "—" : `${r > 0 ? "+" : ""}${r.toFixed(2)}`}</td>
                  <td className="max-w-56 px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1 text-[11px]">
                      {emo(t.emotion) && <span aria-hidden>{emo(t.emotion)}</span>}
                      {t.setup && <span className="rounded bg-surface px-1.5 py-0.5">{t.setup}</span>}
                      {t.tags.slice(0, 2).map((x) => (
                        <span key={x} className="rounded bg-accent-2/10 px-1.5 py-0.5 text-accent-2">
                          {x}
                        </span>
                      ))}
                      {t.mistakes.length > 0 && <span className="rounded bg-neg/10 px-1.5 py-0.5 text-neg">{t.mistakes.length.toLocaleString("fa-IR")} اشتباه</span>}
                      {t.rating && <span className="text-accent-2">{"★".repeat(t.rating)}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-end">
                    <Link href={`/journal/trades/${t.id}/`} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-surface" aria-label={`ویرایش معامله ${t.symbol}`}>
                      <Icon name="edit" size={13} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="py-10 text-center text-sm text-muted">معامله‌ای با این فیلتر نیست.</p>}
      </div>
    </div>
  );
}

/* ------------------------------- Analysis ------------------------------- */

function Analysis({ stats: s, currency: c }: { stats: JournalStats; currency: string }) {
  const emoLabel = (id: string) => {
    const e = EMOTIONS.find((x) => x.id === id);
    return e ? `${e.emoji} ${e.label}` : id;
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="بر اساس نماد">
        <BreakdownTable rows={s.bySymbol} currency={c} label="نماد" showPips />
      </Card>
      <Card title="بر اساس ستاپ / استراتژی">
        <BreakdownTable rows={s.bySetup} currency={c} label="ستاپ" empty="برای معاملات ستاپ ثبت کن تا این بخش پر شود." />
      </Card>
      <Card title="بر اساس سشن معاملاتی" className="lg:col-span-2">
        <PolarityBars data={s.bySession.map((b) => ({ key: b.key, label: SESSION_LABELS[b.key] ?? b.key, value: b.net, sub: `${b.trades} معامله · برد ${b.winRate}%` }))} currency={c} height={180} />
      </Card>
      <Card title="بر اساس روز هفته">
        <PolarityBars data={s.byWeekday.map((b) => ({ key: b.key, label: (WEEKDAY_LABELS[b.key] ?? b.key).slice(0, 2), value: b.net, sub: `${WEEKDAY_LABELS[b.key] ?? b.key} · ${b.trades} معامله · برد ${b.winRate}%` }))} currency={c} height={180} />
      </Card>
      <Card title="بر اساس ساعت باز شدن (تهران)">
        <PolarityBars data={s.byHour.map((b) => ({ key: b.key, label: Number(b.key) % 3 === 0 ? b.key : "", value: b.net, sub: `ساعت ${b.key}:00 · ${b.trades} معامله` }))} currency={c} height={180} />
      </Card>
      <Card title="بر اساس مدت نگه‌داری">
        <BreakdownTable rows={s.byDuration} currency={c} label="مدت" labelOf={(k) => k} />
      </Card>
      <Card title="توزیع نتیجه بر حسب R">
        {s.rTrades ? (
          <PolarityBars data={s.rDistribution.map((b) => ({ key: b.key, label: b.key, value: b.net, sub: `${b.trades} معامله` }))} currency={c} height={180} />
        ) : (
          <p className="py-6 text-center text-sm text-muted">برای محاسبه R، حد ضرر یا مبلغ ریسک معاملات را ثبت کن.</p>
        )}
      </Card>
      <Card title="هزینه اشتباهات">
        <BreakdownTable rows={s.byMistake} currency={c} label="اشتباه" empty="اشتباهی ثبت نشده، یا خیلی منضبطی، یا هنوز ثبتشان نکرده‌ای." />
      </Card>
      <Card title="بر اساس حس و حال">
        <BreakdownTable rows={s.byEmotion} currency={c} label="حس" labelOf={emoLabel} empty="حس و حال را هنگام ثبت معامله انتخاب کن." />
      </Card>
      <Card title="بر اساس تگ">
        <BreakdownTable rows={s.byTag} currency={c} label="تگ" />
      </Card>
      <Card title="کیفیت اجرا (امتیاز)">
        <BreakdownTable rows={s.byRating} currency={c} label="امتیاز" labelOf={(k) => "★".repeat(Number(k))} empty="به معاملات امتیاز اجرا بده." />
      </Card>
    </div>
  );
}

/* --------------------------------- Rules --------------------------------- */

const RULE_TEXT: Record<RuleCheck["id"], { title: string; describe: (r: RuleCheck, c: string) => string }> = {
  profitTarget: { title: "تارگت سود", describe: (r, c) => `${fmtMoney(r.current, c, true)} از ${fmtMoney(r.limit, c)}` },
  dailyLoss: { title: "حد زیان روزانه", describe: (r, c) => `زیان امروز ${fmtMoney(r.current, c)} از سقف ${fmtMoney(r.limit, c)} · بدترین روز: ${fmtMoney(Number(r.detail?.split(":")[1] ?? 0), c)}` },
  maxLoss: { title: "حد زیان کلی", describe: (r, c) => `فاصله تا کف حساب ${fmtMoney(r.current, c)} · کف: ${fmtMoney(Number(r.detail?.split(":")[1] ?? 0), c)}` },
  minDays: { title: "حداقل روز معاملاتی", describe: (r) => `${r.current.toLocaleString("fa-IR")} روز معاملاتی · حداقل لازم: ${r.limit.toLocaleString("fa-IR")} روز` },
  consistency: { title: "قانون ثبات", describe: (r) => `سهم بهترین روز ${fmtNum(r.current, 1)}٪ از کل سود (سقف ${r.limit}٪)` },
};
const STATUS_TEXT: Record<RuleCheck["status"], string> = { ok: "سالم", warning: "نزدیک به حد", breached: "نقض شده", passed: "انجام شد", pending: "در حال انجام" };

function Rules({ stats: s, currency: c, accountId, hasRules }: { stats: JournalStats; currency: string; accountId: number; hasRules: boolean }) {
  if (!hasRules || !s.rules)
    return (
      <EmptyState icon="shield" title="پایش قوانین برای این حساب فعال نیست." description="در تنظیمات حساب، قوانین پراپ (یا پراپ‌فرم را از لیست) انتخاب کن." action={<Link href={`/journal/accounts/${accountId}/edit/`} className={buttonClass("secondary")}>تنظیم قوانین</Link>} />
    );
  return (
    <div className="space-y-6">
      <div className="card flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted">وضعیت کلی چالش</p>
          <p className="mt-1 text-xl font-black">{s.ruleStatus === "passed" ? "شرایط قبولی کامل شده" : s.ruleStatus === "breached" ? "یکی از قوانین نقض شده" : "در حال انجام"}</p>
        </div>
        <RuleStatusBadge status={s.ruleStatus} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {s.rules.map((r) => (
          <div key={r.id} className={cn("card p-5", r.status === "breached" && "border-neg/40", r.status === "warning" && "border-warn/40")}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">{RULE_TEXT[r.id].title}</h3>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", r.status === "breached" ? "bg-neg/10 text-neg" : r.status === "warning" ? "bg-warn/10 text-warn" : r.status === "passed" ? "bg-pos/10 text-pos" : "bg-surface text-muted")}>{STATUS_TEXT[r.status]}</span>
            </div>
            <Meter value={r.progress} tone={r.status} />
            <p className="num mt-2 text-sm text-muted">{RULE_TEXT[r.id].describe(r, c)}</p>
          </div>
        ))}
      </div>
      <p className="text-xs leading-6 text-muted">پایش بر اساس معاملات بسته‌شده ثبت‌شده در ژورنال است؛ سود/زیان شناور معاملات باز و روش دقیق محاسبه هر پراپ‌فرم (مثلاً مبنای اکوییتی) لحاظ نمی‌شود. همیشه داشبورد پراپ‌فرم را مرجع نهایی بدان.</p>
    </div>
  );
}

/* ---------------------------------- Cash ---------------------------------- */

function Cash({ accountId, currency: c, txs }: { accountId: number; currency: string; txs: Awaited<ReturnType<typeof getTransactions>> }) {
  return (
    <div className="space-y-6">
      <Card title="ثبت واریز یا برداشت">
        <TransactionForm accountId={accountId} />
        <p className="mt-3 text-xs text-muted">برداشت سود (Payout) و واریزها روی بالانس اثر دارند ولی در محاسبه درصد رشد (Gain) لحاظ نمی‌شوند.</p>
      </Card>
      <Card title="تراکنش‌ها">
        {txs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">تراکنشی ثبت نشده است.</p>
        ) : (
          <ul className="divide-y divide-line">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="num text-xs text-muted">{fmtDateTime(t.at)}</span>
                <span className="flex-1 truncate">{t.note || (t.type === "deposit" ? "واریز" : "برداشت")}</span>
                <span className={cn("num font-semibold", t.type === "deposit" ? "text-pos" : "text-neg")}>{fmtMoney(t.type === "deposit" ? t.amount : -t.amount, c, true)}</span>
                <ConfirmButton action={deleteTransactionAction} id={t.id} message="این تراکنش حذف شود؟">
                  <Icon name="trash" size={13} />
                </ConfirmButton>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
