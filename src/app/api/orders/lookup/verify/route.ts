import { NextResponse } from "next/server";
import {
  createSessionToken,
  orderLookupCookieHeader,
  verifyMagicLinkToken,
} from "@/lib/domains/order-lookup";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";

function redirectPath(locale: string, query: string): string {
  const prefix = locale === "en" ? "/en" : "";
  return `${prefix}/orders/lookup${query}`;
}

export async function GET(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const ip = getClientIp(req);
  const rate = await rateLimit(`order-lookup-verify:${ip}`, 10, 60_000);
  if (!rate.success) {
    return NextResponse.redirect(
      new URL(redirectPath("mn", "?error=rate_limited"), siteConfig.url)
    );
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const locale = url.searchParams.get("locale") === "en" ? "en" : "mn";

  if (!token) {
    return NextResponse.redirect(
      new URL(redirectPath(locale, "?error=invalid"), siteConfig.url)
    );
  }

  const email = verifyMagicLinkToken(token);
  if (!email) {
    return NextResponse.redirect(
      new URL(redirectPath(locale, "?error=invalid"), siteConfig.url)
    );
  }

  const sessionToken = createSessionToken(email);
  const res = NextResponse.redirect(
    new URL(redirectPath(locale, "?verified=1"), siteConfig.url)
  );
  res.headers.set("Set-Cookie", orderLookupCookieHeader(sessionToken));
  return res;
}