import { clientIp, rateLimited } from "@/lib/spam";

export const dynamic = "force-dynamic";

/** Receives browser crash reports (see lib/report-client-error.ts) and writes them to the server log. */
export async function POST(req: Request) {
  if (rateLimited(`client-error:${clientIp(req)}`)) return new Response(null, { status: 204 });
  const text = (await req.text().catch(() => "")).slice(0, 4000);
  try {
    const r = JSON.parse(text) as Record<string, unknown>;
    console.error(`[client-error] ${r.where} | ${r.message}${r.digest ? ` | digest ${r.digest}` : ""} | ${r.url}\n  ua: ${r.ua}\n  ${String(r.stack ?? "").split("\n").slice(0, 6).join("\n  ")}`);
  } catch {
    /* malformed report */
  }
  return new Response(null, { status: 204 });
}
