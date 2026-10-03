import { z } from "zod";
import { antiSpamSchema, lotterySchema } from "@/lib/validation";
import { clientIp, hashIp, looksAutomated, rateLimited, verifyCaptcha } from "@/lib/spam";
import { saveLotteryRegistration } from "@/lib/db/repository";
import { getActiveCampaign } from "@/lib/services/lotteryService";

export const dynamic = "force-dynamic";
const bodySchema = lotterySchema.and(antiSpamSchema);

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (rateLimited(`lottery:${ip}`)) return Response.json({ ok: false, message: "تعداد درخواست‌ها زیاد است. چند دقیقه دیگر تلاش کنید." }, { status: 429 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ ok: false, message: "درخواست نامعتبر است." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, message: "اطلاعات فرم معتبر نیست.", fieldErrors: z.flattenError(parsed.error).fieldErrors }, { status: 422 });
  }
  const { name, email, phone, telegramId, website, startedAt, turnstileToken } = parsed.data;

  // Silently accept bots so they don't learn what tripped the filter.
  if (looksAutomated(website, startedAt)) return Response.json({ ok: true });
  if (!(await verifyCaptcha(turnstileToken, ip))) return Response.json({ ok: false, message: "تأیید امنیتی ناموفق بود. دوباره تلاش کنید." }, { status: 400 });

  const campaign = await getActiveCampaign().catch(() => null);
  if (!campaign) return Response.json({ ok: false, message: "در حال حاضر قرعه‌کشی فعالی وجود ندارد." }, { status: 409 });
  const result = await saveLotteryRegistration({ name, email, phone, telegramId, campaignId: campaign.slug, ipHash: hashIp(ip) });
  if (!result.ok && result.reason === "duplicate") return Response.json({ ok: false, message: "با این ایمیل یا شماره قبلاً در این دوره ثبت‌نام شده است." }, { status: 409 });
  if (!result.ok) return Response.json({ ok: false, message: "ثبت اطلاعات موقتاً ممکن نیست. لطفاً بعداً تلاش کنید." }, { status: 503 });
  return Response.json({ ok: true }, { status: 201 });
}
