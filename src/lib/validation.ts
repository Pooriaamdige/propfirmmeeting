import { z } from "zod";

/** Normalise Persian/Arabic digits to Latin. */
export function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Iranian mobile (09xxxxxxxxx / +989xxxxxxxxx) or international E.164. */
export function normalizePhone(value: string): string {
  const v = normalizeDigits(value).replace(/[\s\-()]/g, "");
  if (/^(\+98|0098)9\d{9}$/.test(v)) return "0" + v.slice(-10);
  if (/^9\d{9}$/.test(v)) return "0" + v;
  return v;
}

const phoneRegex = /^(09\d{9}|\+[1-9]\d{7,14})$/;
// Telegram usernames: 5–32 chars, letters/digits/underscore, must start with a letter.
const telegramRegex = /^@?[a-zA-Z][a-zA-Z0-9_]{4,31}$/;

export const lotterySchema = z.object({
  name: z.string().trim().min(3, "نام و نام خانوادگی را کامل وارد کنید.").max(120, "نام بیش از حد طولانی است."),
  email: z.string().trim().toLowerCase().pipe(z.email("ایمیل معتبر نیست.")),
  telegramId: z
    .string()
    .trim()
    .regex(telegramRegex, "آیدی تلگرام معتبر نیست (مثلاً ‎@username با حداقل ۵ کاراکتر).")
    .transform((v) => "@" + v.replace(/^@/, "").toLowerCase()),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((v) => phoneRegex.test(v), "شماره تماس معتبر نیست (مثلاً ۰۹۱۲۳۴۵۶۷۸۹)."),
});

export type LotteryFormValues = z.input<typeof lotterySchema>;

export const newsletterSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("ایمیل معتبر نیست.")),
});

/** Anti-spam fields sent with every public form. */
export const antiSpamSchema = z.object({
  website: z.string().max(0).optional().default(""), // honeypot: must stay empty
  startedAt: z.number().int().positive(), // ms timestamp when the form was rendered
  turnstileToken: z.string().optional(),
});
