import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedLotteryWeek, getPublishedLotteryWeeks } from "@/lib/services/lotteryWinnersService";
import { parseLotteryWeek } from "@/lib/lottery-winners";
import { WeekArchive } from "@/components/lottery/WeekArchive";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/Section";
import { LinkButton } from "@/components/ui/Button";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "برندگان قرعه‌کشی",
  description: "آرشیو برندگان قرعه‌کشی‌های هفتگی پراپ‌فرم میتینگ، حساب‌های جایزه و پراپ‌فرم‌های اهداکننده.",
  alternates: { canonical: "/lottery-winners/" },
};

export default async function LotteryWinnersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const weeks = await getPublishedLotteryWeeks();
  const requested = sp.week === undefined ? weeks[0]?.week ?? null : typeof sp.week === "string" ? parseLotteryWeek(sp.week) : null;
  const selected = weeks.find((w) => w.week === requested);
  const result = selected ? await getPublishedLotteryWeek(selected.week) : null;
  const index = weeks.findIndex((w) => w.week === selected?.week);
  const newer = index > 0 ? weeks[index - 1] : null;
  const older = index >= 0 ? weeks[index + 1] : null;

  return <>
    <PageHeader eyebrow="Weekly winners" title="برندگان قرعه‌کشی" subtitle="هر هفته، فرصتی تازه برای برنده شدن. نتایج دوره‌های گذشته و حساب‌های اهداشده را اینجا ببینید.">
      <div className="mt-6"><LinkButton href="/lottery/" variant="secondary"><Icon name="ticket" size={17} /> شرکت در قرعه‌کشی</LinkButton></div>
    </PageHeader>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
      {!weeks.length ? <div className="card px-6 py-16 text-center"><Icon name="gift" size={40} className="mx-auto text-accent-2" /><h2 className="mt-5 text-xl font-bold">منتظر اعلام برندگان باشید</h2><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">نتایج قرعه‌کشی پس از تأیید و انتشار در این صفحه نمایش داده می‌شود. شاید نام برنده بعدی، شما باشید!</p></div> :
        <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
          <WeekArchive weeks={weeks.map((w) => w.week)} selected={selected?.week ?? null} />
          <section className="min-w-0" aria-labelledby="week-results-title">
            {!result ? <div className="card p-8 text-center"><h2 id="week-results-title" className="text-xl font-bold">نتایج این هفته منتشر نشده است</h2><p className="mt-3 text-sm text-muted">یکی از هفته‌های آرشیو را انتخاب کنید.</p><Link href="/lottery-winners/" className="mt-5 inline-block text-accent hover:underline">مشاهده جدیدترین نتایج</Link></div> : <>
              <div className="relative overflow-hidden rounded-2xl border border-accent-2/25 bg-gradient-to-bl from-accent-2/10 via-card to-card p-6 sm:p-8">
                <span className="pointer-events-none absolute -end-10 -top-10 text-accent-2/[0.07]" aria-hidden><Icon name="trophy" size={210} /></span>
                <div className="relative">
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-xs"><span className="rounded-full border border-accent-2/30 bg-accent-2/10 px-3 py-1.5 font-semibold text-accent-2">{index === 0 ? "جدیدترین نتایج" : "آرشیو نتایج"}</span><span className="inline-flex items-center gap-1 text-muted"><Icon name="check" size={14} /> نتایج نهایی</span></div>
                  <h2 id="week-results-title" className="text-2xl font-black sm:text-3xl">برندگان هفته <span className="text-accent-2">{result.week.toLocaleString("fa-IR")}</span></h2>
                  <p className="mt-3 text-sm leading-7 text-muted">به برندگان خوش‌شانس این هفته تبریک می‌گوییم!</p>
                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-accent-2/15 pt-4 text-sm">
                    <span className="inline-flex items-center gap-2"><Icon name="user" size={16} className="text-accent-2" /> {result.winners.length.toLocaleString("fa-IR")} برنده</span>
                    <span className="inline-flex items-center gap-2"><Icon name="gift" size={16} className="text-accent-2" /> {[...new Set(result.winners.map((w) => w.firmName))].length.toLocaleString("fa-IR")} پراپ‌فرم اهداکننده</span>
                    {result.drawnOn && <time dateTime={result.drawnOn} className="inline-flex items-center gap-2 text-muted"><Icon name="calendar" size={16} />{new Date(`${result.drawnOn}T12:00:00Z`).toLocaleDateString("fa-IR", { timeZone: "Asia/Tehran", dateStyle: "long" })}</time>}
                  </div>
                </div>
              </div>
              <div className="mb-3 mt-8 flex items-center gap-2"><Icon name="trophy" size={19} className="text-accent-2" /><h3 className="font-bold">این هفته، نوبت این برندگان بود</h3></div>
              <div className="hidden grid-cols-[2.2rem_minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-4 px-5 py-3 text-xs text-muted md:grid" aria-hidden><span>#</span><span>ایمیل برنده</span><span>حساب جایزه</span><span>پراپ‌فرم اهداکننده</span></div>
              <ol className="space-y-3">
                {result.winners.map((winner, i) => <li key={i} className="card grid min-w-0 gap-4 p-5 transition hover:border-accent-2/30 md:grid-cols-[2.2rem_minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,1fr)] md:items-center">
                  <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent-2/20 bg-accent-2/10 text-sm font-bold text-accent-2">{(i + 1).toLocaleString("fa-IR")}</span><span className="text-xs text-muted md:hidden">برنده هفته {result.week.toLocaleString("fa-IR")}</span></div>
                  <div className="min-w-0"><span className="sr-only">ایمیل برنده: </span><bdi dir="ltr" className="block break-all text-start text-sm font-semibold">{winner.email}</bdi></div>
                  <div className="flex items-center justify-between gap-3 md:block"><span className="text-xs text-muted md:hidden">حساب جایزه</span><span dir="auto" className="inline-block max-w-full break-words rounded-lg bg-accent/10 px-3 py-2 text-sm font-bold text-accent">{winner.account}</span></div>
                  <div className="flex min-w-0 items-center justify-between gap-3 border-t border-line pt-3 md:block md:border-0 md:pt-0"><span className="text-xs text-muted md:hidden">پراپ‌فرم اهداکننده</span><bdi className="break-words text-sm font-medium">{winner.firmName}</bdi></div>
                </li>)}
              </ol>
              <nav aria-label="مرور نتایج هفته‌ها" className="mt-6 flex justify-between gap-4 text-sm">
                {newer ? <Link href={`/lottery-winners/?week=${newer.week}`} className="inline-flex min-h-11 items-center gap-2 text-muted hover:text-accent"><Icon name="arrow-right" size={16} /> هفته {newer.week.toLocaleString("fa-IR")}</Link> : <span />}
                {older && <Link href={`/lottery-winners/?week=${older.week}`} className="inline-flex min-h-11 items-center gap-2 text-muted hover:text-accent">هفته {older.week.toLocaleString("fa-IR")} <Icon name="arrow-left" size={16} /></Link>}
              </nav>
            </>}
          </section>
        </div>}
    </div>
  </>;
}
