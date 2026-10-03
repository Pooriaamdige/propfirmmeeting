import Link from "next/link";
import { count, desc, eq, sum } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getHealth } from "@/lib/services/health";
import { getMarketQuotes } from "@/lib/services/marketService";
import { getEconomicCalendar } from "@/lib/services/economicCalendarService";
import { TICKER_SYMBOLS } from "@/lib/symbols";
import { Badge, Flash, PageTitle, Panel, StatCard, Table, fmtDate } from "@/components/admin/ui";

async function probe() {
  // Exercise the providers so the health table reflects reality, even on a cold server.
  const [m, c] = await Promise.allSettled([getMarketQuotes(TICKER_SYMBOLS), getEconomicCalendar("this-week", "Asia/Tehran")]);
  return {
    market: m.status === "fulfilled" ? { ok: true as const, source: m.value.source, isMock: m.value.isMock, count: m.value.data.length, at: m.value.fetchedAt } : { ok: false as const, error: String((m.reason as Error)?.message ?? m.reason) },
    calendar: c.status === "fulfilled" ? { ok: true as const, source: c.value.source, isMock: c.value.isMock, count: c.value.data.length, at: c.value.fetchedAt } : { ok: false as const, error: String((c.reason as Error)?.message ?? c.reason) },
  };
}

export default async function Dashboard({ searchParams }: PageProps<"/admin">) {
  const sp = await searchParams;
  const d = await db();
  const [[firms], [coupons], [copies], [articles], [subs], [regs], recent, active, status] = await Promise.all([
    d.select({ n: count() }).from(schema.propFirms),
    d.select({ n: count() }).from(schema.coupons).where(eq(schema.coupons.active, true)),
    d.select({ n: sum(schema.coupons.copyCount) }).from(schema.coupons),
    d.select({ n: count() }).from(schema.articles),
    d.select({ n: count() }).from(schema.newsletterSubscribers),
    d.select({ n: count() }).from(schema.lotteryRegistrations),
    d.select().from(schema.lotteryRegistrations).orderBy(desc(schema.lotteryRegistrations.createdAt)).limit(6),
    d.select().from(schema.lotteryCampaigns).where(eq(schema.lotteryCampaigns.active, true)).limit(1),
    probe(),
  ]);
  const health = getHealth();

  return (
    <>
      <PageTitle title="داشبورد" subtitle="نمای کلی محتوا، ثبت‌نام‌ها و وضعیت منابع داده زنده" />
      <Flash error={sp.error === "forbidden" ? "دسترسی این بخش فقط برای مدیر کل است." : null} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="پراپ‌فرم‌ها" value={firms.n} icon="shield" href="/admin/prop-firms/" />
        <StatCard label="کدهای تخفیف فعال" value={coupons.n} icon="ticket" href="/admin/coupons/" tone="gold" />
        <StatCard label="کپی کدهای تخفیف" value={Number(copies.n ?? 0)} icon="copy" href="/admin/coupons/" />
        <StatCard label="مقالات" value={articles.n} icon="book" href="/admin/articles/" tone="gold" />
        <StatCard label="ثبت‌نام قرعه‌کشی" value={regs.n} icon="gift" href="/admin/lottery/" />
        <StatCard label="اعضای خبرنامه" value={subs.n} icon="mail" href="/admin/newsletter/" tone="gold" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <Panel title="وضعیت داده‌های زنده">
          <div className="space-y-3 text-sm">
            {(["market", "calendar"] as const).map((k) => {
              const s = status[k];
              return (
                <div key={k} className="rounded-lg border border-line p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{k === "market" ? "قیمت‌های بازار" : "تقویم اقتصادی / اخبار"}</span>
                    {s.ok ? <Badge tone={s.isMock ? "warn" : "pos"}>{s.isMock ? "داده نمایشی" : "زنده"}</Badge> : <Badge tone="neg">قطع</Badge>}
                  </div>
                  <p className="mt-1.5 text-xs text-muted" dir={s.ok ? undefined : "ltr"}>
                    {s.ok ? <>منبع: <span dir="ltr">{s.source}</span> · {s.count} مورد · {fmtDate(s.at)}</> : s.error}
                  </p>
                </div>
              );
            })}
          </div>
          <Table head={["منبع", "آخرین موفقیت", "آخرین خطا", "وضعیت"]} empty={health.length === 0}>
            {health.map((h) => (
              <tr key={h.name}>
                <td className="px-4 py-2.5 font-medium" dir="ltr">{h.name}</td>
                <td className="px-4 py-2.5 text-xs text-muted">{fmtDate(h.lastSuccessAt)}</td>
                <td className="max-w-56 truncate px-4 py-2.5 text-xs text-muted" dir="ltr" title={h.lastError ?? ""}>{h.lastError ?? "—"}</td>
                <td className="px-4 py-2.5">{h.consecutiveFailures === 0 && h.lastSuccessAt ? <Badge tone="pos">سالم</Badge> : h.calls === 0 ? <Badge>استفاده نشده</Badge> : <Badge tone="neg">{h.consecutiveFailures} خطای پیاپی</Badge>}</td>
              </tr>
            ))}
          </Table>
          <p className="mt-3 text-xs leading-6 text-muted">
            اگر منابع از سرور شما در دسترس نیستند (محدودیت جغرافیایی)، متغیر <code dir="ltr">OUTBOUND_PROXY_URL</code> را تنظیم کنید. برای قیمت لحظه‌ای و رایگان طلا و فارکس، توکن حساب دمو <code dir="ltr">OANDA_API_TOKEN</code> را اضافه کنید. خطای <code dir="ltr">429</code> یعنی سقف درخواست آن منبع پر شده است.
          </p>
        </Panel>

        <Panel title="آخرین ثبت‌نام‌های قرعه‌کشی" actions={<Link href="/admin/lottery/" className="text-xs text-accent hover:underline">همه</Link>}>
          <p className="mb-3 text-xs text-muted">کمپین فعال: {active[0] ? <strong className="text-fg">{active[0].title}</strong> : "ندارد"}</p>
          <Table head={["نام", "تلگرام", "تاریخ"]} empty={recent.length === 0}>
            {recent.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-2.5">{r.name}</td>
                <td className="px-4 py-2.5 text-xs" dir="ltr">{r.telegramId}</td>
                <td className="px-4 py-2.5 text-xs text-muted">{fmtDate(r.createdAt)}</td>
              </tr>
            ))}
          </Table>
        </Panel>
      </div>
    </>
  );
}
