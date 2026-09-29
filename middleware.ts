import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// First line of defense: cheap signature check on the session cookie.
// Pages and API routes still re-check the user against the database (requireUser / requireAdmin).
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (!session) {
    if (isApi) return NextResponse.json({ error: "Sign in to continue." }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (isAdmin && session.role !== "ADMIN") {
    if (isApi) return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/profile/:path*",
    "/wishlist/:path*",
    "/history/:path*",
    "/ai-assistant/:path*",
    "/api/wishlist/:path*",
    "/api/preferences/:path*",
    "/api/conversations/:path*",
  ],
};
