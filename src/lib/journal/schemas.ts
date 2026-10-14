import { z } from "zod";

const num = z.preprocess((v) => (v === "" || v == null ? undefined : typeof v === "string" ? Number(v.replace(/[,٬\s]/g, "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))) : v), z.number().finite());
const optNum = z.preprocess((v) => (v === "" || v == null ? null : typeof v === "string" ? Number(v.replace(/[,٬\s]/g, "").replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))) : v), z.number().finite().nullable());
const pct = optNum.refine((v) => v === null || (v > 0 && v <= 100), "درصد باید بین ۰ و ۱۰۰ باشد");
const isoDate = z.string().refine((v) => !Number.isNaN(Date.parse(v)), "تاریخ نامعتبر است");
const list = z.preprocess((v) => (typeof v === "string" ? (v ? JSON.parse(v) : []) : v ?? []), z.array(z.string().trim().min(1).max(60)).max(20));

export const accountSchema = z.object({
  name: z.string().trim().min(2, "نام حساب را وارد کنید").max(120),
  type: z.enum(["challenge", "funded", "personal", "demo"]),
  firmId: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable()),
  firmName: z.string().trim().max(120).default(""),
  broker: z.string().trim().max(120).default(""),
  platform: z.string().trim().max(40).default(""),
  currency: z.string().trim().toUpperCase().length(3).default("USD"),
  initialBalance: num.refine((v) => v > 0, "بالانس اولیه باید مثبت باشد"),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاریخ شروع نامعتبر است"),
  useRules: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  dailyDrawdownPct: pct,
  maxDrawdownPct: pct,
  maxDrawdownType: z.enum(["static", "trailing"]).default("static"),
  profitTargetPct: pct,
  minTradingDays: optNum.refine((v) => v === null || (Number.isInteger(v) && v >= 0 && v <= 365), "عدد صحیح وارد کنید"),
  consistencyPct: pct,
  resetTz: z.string().max(40).default("Europe/Athens"),
});

export const tradeSchema = z
  .object({
    accountId: z.coerce.number().int().positive(),
    symbol: z.string().trim().min(2, "نماد را وارد کنید").max(20),
    side: z.enum(["buy", "sell"]),
    openedAt: isoDate,
    closedAt: z.preprocess((v) => (v === "" ? null : v), isoDate.nullable()),
    entryPrice: num.refine((v) => v > 0, "قیمت ورود را وارد کنید"),
    exitPrice: optNum,
    lots: num.refine((v) => v > 0, "حجم را وارد کنید"),
    stopLoss: optNum,
    takeProfit: optNum,
    profit: optNum,
    commission: optNum.transform((v) => Math.abs(v ?? 0)),
    swap: optNum.transform((v) => v ?? 0),
    pips: optNum,
    riskAmount: optNum.refine((v) => v === null || v >= 0, "مبلغ ریسک نمی‌تواند منفی باشد"),
    setup: z.string().trim().max(80).default(""),
    tags: list,
    mistakes: list,
    emotion: z.string().max(20).default(""),
    rating: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(1).max(5).nullable()),
    notes: z.string().max(5000).default(""),
    screenshotUrl: z.preprocess((v) => (v === "" ? null : v), z.string().url("لینک تصویر معتبر نیست").max(500).nullable()),
  })
  .superRefine((t, ctx) => {
    if (t.closedAt) {
      if (t.exitPrice === null) ctx.addIssue({ code: "custom", path: ["exitPrice"], message: "برای معامله بسته‌شده قیمت خروج لازم است" });
      if (Date.parse(t.closedAt) < Date.parse(t.openedAt)) ctx.addIssue({ code: "custom", path: ["closedAt"], message: "زمان بستن قبل از زمان باز شدن است" });
    }
  });
export type TradeInput = z.infer<typeof tradeSchema>;

export const transactionSchema = z.object({
  accountId: z.coerce.number().int().positive(),
  type: z.enum(["deposit", "withdrawal"]),
  amount: num.refine((v) => v > 0, "مبلغ باید مثبت باشد"),
  at: isoDate,
  note: z.string().trim().max(300).default(""),
});
