import { antiSpamSchema, newsletterSchema } from "@/lib/validation";
import { clientIp, looksAutomated, rateLimited } from "@/lib/spam";
import { saveNewsletterSubscriber } from "@/lib/db/repository";

export const dynamic = "force-dynamic";
const bodySchema = newsletterSchema.and(antiSpamSchema.omit({ turnstileToken: true }));

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (rateLimited(`newsletter:${ip}`)) return Response.json({ ok: false, message: "تعداد درخواست‌ها زیاد است." }, { status: 429 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ ok: false, message: "ایمیل معتبر نیست." }, { status: 422 });
  if (looksAutomated(parsed.data.website, parsed.data.startedAt)) return Response.json({ ok: true });

  const result = await saveNewsletterSubscriber(parsed.data.email);
  if (!result.ok && result.reason === "duplicate") return Response.json({ ok: true, message: "این ایمیل قبلاً عضو خبرنامه است." });
  if (!result.ok) return Response.json({ ok: false, message: "عضویت موقتاً ممکن نیست." }, { status: 503 });
  return Response.json({ ok: true }, { status: 201 });
}
