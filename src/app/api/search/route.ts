import { search } from "@/lib/services/searchService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 80);
  return Response.json(await search(q), { headers: { "Cache-Control": "public, s-maxage=60" } });
}
