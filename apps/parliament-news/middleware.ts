import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { needsStudioAuth, parseHost } from "./lib/host";

/**
 * Edge дээр ажиллана — Prisma дуудахгүй. Хоёр ажил:
 * 1. host-ыг хэлбэржүүлж x-tenant-host болгон дамжуулах
 * 2. /studio-д нэвтрэлт шалгах
 * tenant-ыг DB-ээс хайх, эрх шалгах нь Node runtime дээр (lib/tenant, lib/trpc).
 */
const TENANT_HEADER = "x-tenant-host";

export async function middleware(request: NextRequest) {
  const forwarded = new Headers(request.headers);
  const { value } = parseHost(request.headers.get("host"));

  // Клиент өөрөө x-tenant-host илгээж өөр tenant уншихыг хориглоно
  if (value) {
    forwarded.set(TENANT_HEADER, value);
  } else {
    forwarded.delete(TENANT_HEADER);
  }

  const { pathname } = request.nextUrl;

  if (needsStudioAuth(pathname)) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const signInUrl = new URL("/studio/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next({ request: { headers: forwarded } });
}

/**
 * Зөвхөн Next-ийн дотоод файлыг хасна. Цэгтэй замыг хасаж болохгүй:
 * tRPC-ийн nested procedure (/api/trpc/news.list) ба нийтийн feed
 * (/rss.xml, /sitemap.xml) цэгтэй байдаг.
 *
 * ЭНЭ ЛИТЕРАЛ байх ёстой. Next нь config-ийг build үед статикаар уншдаг тул
 * import хийсэн тогтмолыг танихгүй, бүх замыг хамрах default руу унана.
 * lib/host.test.ts нь энэ утгыг шууд уншиж шалгадаг.
 */
export const config = {
  matcher: ["/((?!_next/).*)"],
};
