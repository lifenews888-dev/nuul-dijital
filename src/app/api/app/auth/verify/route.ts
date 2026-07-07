import { NextResponse } from "next/server";
import { verifyMagicLinkToken } from "@/lib/domains/order-lookup";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { signIn } from "@/lib/auth";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";

function redirectPath(locale: string, query: string): string {
  return `/app${query}`;
}

export async function GET(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const ip = getClientIp(req);
  const rate = await rateLimit(`app-auth-verify:${ip}`, 10, 60_000);
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

  return signIn("customer-magic-link", {
    token,
    redirectTo: redirectPath(locale, "?verified=1"),
  });
}