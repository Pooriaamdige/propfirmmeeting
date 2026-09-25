import { getForexNews } from "@/lib/services/newsService";
import { fail, ok, parseTimeZone } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const tz = parseTimeZone(new URL(req.url).searchParams.get("tz"));
  try {
    return ok(await getForexNews(tz), 60);
  } catch (err) {
    return fail(err, "دریافت اخبار بازار با مشکل مواجه شد.");
  }
}
