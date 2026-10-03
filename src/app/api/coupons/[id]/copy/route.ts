import { recordCouponCopy } from "@/lib/services/couponService";
import { clientIp, rateLimited } from "@/lib/spam";

export const dynamic = "force-dynamic";

/** Counts a "copy code" click (analytics for the admin). */
export async function POST(req: Request, ctx: RouteContext<"/api/coupons/[id]/copy">) {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return new Response(null, { status: 400 });
  if (rateLimited(`copy:${clientIp(req)}:${id}`)) return new Response(null, { status: 204 });
  try {
    await recordCouponCopy(id);
  } catch {
    /* analytics only */
  }
  return new Response(null, { status: 204 });
}
