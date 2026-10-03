import { z } from "zod";

const rule = z.object({ status: z.enum(["allowed", "restricted", "not-allowed", "unknown"]), note: z.string().max(1000) });
const pct = z.coerce.number().min(0).max(100);
const nullablePct = z.union([pct, z.null()]);
const tier = z.object({ accountSize: z.coerce.number().positive(), fee: z.coerce.number().nonnegative(), currency: z.enum(["USD", "EUR"]) });

export const firmSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "اسلاگ فقط حروف انگلیسی کوچک، عدد و خط تیره"),
  name: z.string().trim().min(2).max(120),
  published: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.coerce.number().int(),
  data: z.object({
    logo: z.object({ monogram: z.string().trim().min(1).max(3), color: z.string().regex(/^#[0-9a-fA-F]{6}$/), src: z.string().url().optional().or(z.literal("").transform(() => undefined)) }),
    website: z.string().url(),
    country: z.string().trim().max(80).nullable(),
    foundedYear: z.coerce.number().int().min(1990).max(2100).nullable(),
    description: z.string().trim().max(3000),
    program: z.string().trim().max(160),
    platforms: z.array(z.string().trim().min(1)).max(20),
    challengeFee: tier,
    feeTiers: z.array(tier).max(20),
    phases: z.array(z.object({ name: z.string().trim().min(1), profitTarget: nullablePct, dailyDrawdown: pct, maxDrawdown: pct, minTradingDays: z.coerce.number().int().min(0).nullable(), timeLimit: z.string().max(60) })).max(5),
    profitTarget: z.object({ phase1: nullablePct, phase2: nullablePct }),
    dailyDrawdown: z.object({ value: pct, basis: z.string().max(300) }),
    maxDrawdown: z.object({ value: pct, type: z.enum(["static", "trailing", "relative"]), basis: z.string().max(300) }),
    profitSplit: z.object({ base: pct, max: pct }),
    leverage: z.object({ forex: z.string().max(20), metals: z.string().max(20) }),
    minimumTradingDays: z.coerce.number().int().min(0).nullable(),
    newsTrading: rule,
    weekendHolding: rule,
    overnightHolding: rule,
    eaAllowed: rule,
    copyTrading: rule,
    hedging: rule,
    consistencyRule: rule,
    ipRules: rule,
    vpnVps: rule,
    payoutRules: z.object({ firstPayout: z.string().max(200), frequency: z.string().max(200), methods: z.array(z.string().trim().min(1)).max(20), note: z.string().max(1000) }),
    scalingRules: z.object({ available: z.boolean(), note: z.string().max(1000) }),
    refundPolicy: z.object({ available: z.boolean(), note: z.string().max(1000) }),
    accessNote: z.string().max(2000),
    highlights: z.array(z.string().trim().min(1)).max(20),
    limitations: z.array(z.string().trim().min(1)).max(20),
    faq: z.array(z.object({ question: z.string().trim().min(1), answer: z.string().trim().min(1) })).max(30),
    sources: z.array(z.object({ label: z.string().trim().min(1), url: z.string().url() })).max(20),
    status: z.enum(["reviewed", "in-review", "outdated"]),
    lastReviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  }),
});
export type FirmInput = z.infer<typeof firmSchema>;

const optDate = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "تاریخ نامعتبر است");
const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const couponSchema = z.object({
  firmId: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().positive().nullable()),
  title: z.string().trim().min(2, "عنوان را وارد کنید").max(160),
  code: z.string().trim().min(2, "کد را وارد کنید").max(64),
  discountLabel: z.string().trim().min(1, "برچسب تخفیف را وارد کنید").max(60),
  discountPercent: z.preprocess((v) => (v === "" || v == null ? null : Number(v)), z.number().int().min(0).max(100).nullable()),
  description: z.string().trim().max(1000).default(""),
  terms: z.string().trim().max(2000).default(""),
  url: z.preprocess((v) => (v === "" ? null : v), z.string().url("لینک معتبر نیست").nullable()),
  startsAt: optDate,
  expiresAt: optDate,
  featured: checkbox,
  active: checkbox,
  sortOrder: z.coerce.number().int().default(0),
});

export const articleSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "اسلاگ فقط حروف انگلیسی کوچک، عدد و خط تیره"),
  title: z.string().trim().min(3).max(200),
  excerpt: z.string().trim().min(10, "خلاصه حداقل ۱۰ کاراکتر").max(500),
  category: z.enum(["prop-firm", "forex", "risk", "psychology", "strategy", "market-news", "education"]),
  body: z.string().trim().min(20, "متن مقاله کوتاه است"),
  author: z.string().trim().min(2).max(80),
  readingMinutes: z.coerce.number().int().min(1).max(120),
  published: checkbox,
  publishedAt: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : new Date())),
});

export const campaignSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "شناسه فقط حروف انگلیسی کوچک، عدد و خط تیره"),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(2000).default(""),
  prize: z.string().trim().max(200).default(""),
  startsAt: optDate,
  endsAt: optDate,
  active: checkbox,
});

export const settingsSchema = z.object({
  hero: z.object({ title: z.string().trim().min(2).max(120), highlight: z.string().trim().min(2).max(120), subtitle: z.string().trim().max(400) }),
  announcement: z.object({ enabled: checkbox, text: z.string().trim().max(200), href: z.string().trim().max(300) }),
  social: z.object({ telegram: z.string().trim().max(300), instagram: z.string().trim().max(300), x: z.string().trim().max(300), email: z.string().trim().max(300) }),
  contact: z.object({ email: z.string().trim().max(254), telegramSupport: z.string().trim().max(100) }),
});

export const userSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("ایمیل معتبر نیست")),
  name: z.string().trim().max(120).default(""),
  password: z.string().min(8, "رمز عبور حداقل ۸ کاراکتر"),
  role: z.enum(["admin", "editor"]),
});
