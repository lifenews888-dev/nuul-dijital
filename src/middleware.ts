import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware: guards the /admin area.
 *
 * We only check for the presence of an Auth.js session cookie here (fast, edge-safe)
 * and redirect unauthenticated visitors to the login page. Authoritative verification
 * (valid session + ADMIN/EDITOR role) happens in the admin layout via `auth()`.
 */
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow the login page itself through.
  if (pathname.startsWith("/admin/login")) return NextResponse.next();

  if (pathname.startsWith("/admin")) {
    const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
