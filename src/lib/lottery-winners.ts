import { z } from "zod";

export const FIRST_LOTTERY_WEEK = 52;

export const lotteryWinnerSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email("ایمیل برنده معتبر نیست.")),
  account: z.string().trim().min(1, "حساب جایزه را وارد کنید.").max(100),
  firmName: z.string().trim().min(1, "نام پراپ‌فرم را وارد کنید.").max(120),
});

export const lotteryWeekSchema = z.object({
  week: z.number().int().min(1).max(2147483647),
  drawnOn: z.union([z.iso.date(), z.literal("")]).transform((v) => v || null),
  published: z.boolean(),
  winners: z.array(lotteryWinnerSchema),
}).superRefine((value, ctx) => {
  if (value.published && !value.winners.length) {
    ctx.addIssue({ code: "custom", path: ["winners"], message: "برای انتشار، حداقل یک برنده اضافه کنید." });
  }
});

export type LotteryWinner = z.infer<typeof lotteryWinnerSchema>;

/** Accept Persian and Arabic digits in archive search and week links. */
export function parseLotteryWeek(value: string): number | null {
  const ascii = value.trim().replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632));
  if (!/^\d+$/.test(ascii)) return null;
  const week = Number(ascii);
  return Number.isSafeInteger(week) && week > 0 && week <= 2147483647 ? week : null;
}
