import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { needsStudioAuth } from "./lib/routes";
import { newsAuthSecret, cookieName } from "./lib/auth-env";

/**
 * Edge дээр ажиллана: зөвхөн /studio-ийн нэвтрэлтийн хаалга.
 * Tenant-ыг домэйноор хайхаа больсон (нэг сайт) тул header дамжуулахгүй.
 */
export async function middleware(request: NextRequest) {
  if (!needsStudioAuth(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  /**
   * Түлхүүр ба cookie-ийн нэр `lib/auth.ts`-тай ЯГ таарах ёстой — эс бөгөөс
   * нэвтэрсэн хүний токеныг middleware танихгүй, нэвтрэх хуудас руу
   * хязгааргүй чиглүүлнэ.
   */
  const secure = process.env.NODE_ENV === "production";
  const token = await getToken({
    req: request,
    secret: newsAuthSecret() ?? process.env.NEXTAUTH_SECRET,
    cookieName: cookieName("session-token", secure),
    secureCookie: secure,
  });

  if (!token) {
    const signInUrl = new URL("/studio/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

/**
 * ЭНЭ ЛИТЕРАЛ байх ёстой: Next нь config-ийг build үед статикаар уншдаг тул
 * import хийсэн тогтмолыг танихгүй, бүх замыг хамрах default руу унана.
 * Зөвхөн /studio хамрагдана — бусад зам middleware-гүй, хямд.
 */
export const config = {
  matcher: ["/studio/:path*"],
};
