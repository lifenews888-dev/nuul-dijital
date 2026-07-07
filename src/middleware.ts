import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

/**
 * Composed middleware:
 *  - /admin/*  → fast cookie presence check (authoritative auth runs in the
 *    admin layout). The admin area is intentionally NOT localized.
 *  - everything else → next-intl locale routing (mn default, /en for English).
 */
const intlMiddleware = createMiddleware(routing);

const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname.startsWith("/admin/login")) return NextResponse.next();
    const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/app")) {
    if (
      pathname.startsWith("/app/login") ||
      pathname.startsWith("/app/set-password") ||
      pathname.startsWith("/app/forgot-password")
    ) {
      return NextResponse.next();
    }
    const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/app/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  // Run on app routes; skip API, Next internals, and files with an extension
  // (sitemap.xml, robots.txt, manifest.webmanifest, static assets).
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
