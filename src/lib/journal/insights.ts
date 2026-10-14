import type { Bucket, JournalStats } from "./analytics";
import { SESSION_LABELS, WEEKDAY_LABELS } from "./instruments";
import { fmtMoney } from "./format";

export interface Insight {
  tone: "pos" | "neg" | "info";
  text: string;
}

const MIN = 5; // minimum trades in a bucket before we call it a pattern

/** Plain-language observations from the stats — the "so what" a trader needs. */
export function buildInsights(s: JournalStats): Insight[] {
  const out: Insight[] = [];
  const c = s.currency;
  const money = (v: number) => fmtMoney(v, c, true);
  if (s.trades.closed < 10) {
    out.push({ tone: "info", text: `برای الگوهای قابل اعتماد حداقل ۱۰ تا ۳۰ معامله لازم است (الان ${s.trades.closed.toLocaleString("fa-IR")} معامله بسته‌شده).` });
  }
  const best = (bs: Bucket[]) => bs.filter((b) => b.trades >= MIN).sort((a, b) => b.net - a.net)[0];
  const worst = (bs: Bucket[]) => bs.filter((b) => b.trades >= MIN).sort((a, b) => a.net - b.net)[0];

  const bs = best(s.bySetup);
  if (bs && bs.net > 0) out.push({ tone: "pos", text: `بهترین ستاپ: «${bs.key}» با ${money(bs.net)} و نرخ برد ${bs.winRate}٪ در ${bs.trades.toLocaleString("fa-IR")} معامله.` });
  const ws = worst(s.bySetup);
  if (ws && ws.net < 0) out.push({ tone: "neg", text: `ستاپ «${ws.key}» در مجموع ${money(ws.net)} زیان داده؛ کنار گذاشتن یا بازبینی آن را در نظر بگیر.` });

  const wsym = worst(s.bySymbol);
  if (wsym && wsym.net < 0) out.push({ tone: "neg", text: `بیشترین زیان روی ${wsym.key}: ${money(wsym.net)} (${wsym.trades.toLocaleString("fa-IR")} معامله).` });
  const bsym = best(s.bySymbol);
  if (bsym && bsym.net > 0) out.push({ tone: "pos", text: `سودده‌ترین نماد: ${bsym.key} با ${money(bsym.net)}.` });

  const wsess = worst(s.bySession);
  if (wsess && wsess.net < 0) out.push({ tone: "neg", text: `معاملات سشن ${SESSION_LABELS[wsess.key] ?? wsess.key} در مجموع ${money(wsess.net)} بوده است.` });
  const wday = worst(s.byWeekday);
  if (wday && wday.net < 0) out.push({ tone: "neg", text: `ضعیف‌ترین روز هفته: ${WEEKDAY_LABELS[wday.key] ?? wday.key} (${money(wday.net)}).` });

  const mistakeCost = s.byMistake.filter((m) => m.net < 0).reduce((a, m) => a + m.net, 0);
  if (s.byMistake[0] && s.byMistake[0].net < 0) out.push({ tone: "neg", text: `اشتباهات ثبت‌شده در مجموع ${money(mistakeCost)} هزینه داشته‌اند؛ پرهزینه‌ترین: «${s.byMistake[0].key}» (${money(s.byMistake[0].net)}).` });

  if (s.avgHoldLossMinutes > 0 && s.avgHoldWinMinutes > 0 && s.avgHoldLossMinutes > s.avgHoldWinMinutes * 1.5)
    out.push({ tone: "neg", text: "معاملات زیان‌ده را خیلی بیشتر از معاملات سودده نگه می‌داری؛ ممکن است زیان‌ها را دیر می‌بندی." });
  if (s.payoffRatio !== null && s.payoffRatio < 1 && s.winRate < 60) out.push({ tone: "neg", text: `میانگین سود هر برد کمتر از میانگین زیان هر باخت است (نسبت ${s.payoffRatio}) و نرخ برد ${s.winRate}٪ آن را جبران نمی‌کند.` });
  if (s.zScore !== null && Math.abs(s.zScore) > 1.96)
    out.push({ tone: "info", text: s.zScore > 0 ? "Z-Score مثبت معنادار: بعد از برد معمولاً باخت می‌آید (و برعکس)." : "Z-Score منفی معنادار: بردها و باخت‌ها پشت‌سرهم می‌آیند؛ بعد از باخت ریسک را کم کن." });

  const loR = s.byRating.filter((b) => ["1", "2"].includes(b.key)).reduce((a, b) => a + b.net, 0);
  const hiR = s.byRating.filter((b) => ["4", "5"].includes(b.key)).reduce((a, b) => a + b.net, 0);
  if (loR < 0 && hiR > 0) out.push({ tone: "info", text: `وقتی طبق پلن اجرا می‌کنی (۴-۵ ستاره) ${money(hiR)} و وقتی نه (۱-۲ ستاره) ${money(loR)} نتیجه گرفته‌ای.` });

  return out.slice(0, 8);
}
