import { NextResponse, type NextRequest } from "next/server";

/** Optimistic guard: bounce visitors without a session cookie to the admin login. Real checks happen server-side. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!request.cookies.has("pfm_admin")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export const config = { matcher: ["/admin/:path*"] };
