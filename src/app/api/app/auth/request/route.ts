import { NextResponse } from "next/server";
import {
  createMagicLinkToken,
  normalizeLookupEmail,
} from "@/lib/domains/order-lookup";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { escapeHtml, sendEmail } from "@/lib/mail";
import { guardMutation } from "@/lib/security";
import { siteConfig } from "@/lib/site";
import { appAuthRequestSchema } from "@/lib/validations/app";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const { response } = await guardMutation(req, {
    key: "app-auth-request",
    limit: 5,
    windowMs: 60_000,
  });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = appAuthRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = normalizeLookupEmail(parsed.data.email);
    const locale =
      parsed.data.locale ??
      (req.headers.get("accept-language")?.startsWith("en") ? "en" : "mn");

    const token = createMagicLinkToken(email);
    const base = siteConfig.url.replace(/\/$/, "");
    const link = `${base}/api/app/auth/verify?token=${encodeURIComponent(token)}&locale=${locale}`;

    await sendEmail({
      to: email,
      subject:
        locale === "en"
          ? "Sign in to Nuul Digital"
          : "Nuul Digital-д нэвтрэх",
      html:
        locale === "en"
          ? `
        <h2 style="font-family:sans-serif">Your customer portal</h2>
        <p style="font-family:sans-serif">Click below to sign in to your Nuul Digital account. This link expires in 15 minutes.</p>
        <p style="font-family:sans-serif"><a href="${escapeHtml(link)}">Sign in</a></p>
        <p style="font-family:sans-serif;color:#666;font-size:13px">If you did not request this email, you can ignore it.</p>`
          : `
        <h2 style="font-family:sans-serif">Таны хэрэглэгчийн портал</h2>
        <p style="font-family:sans-serif">Доорх холбоосоор Nuul Digital бүртгэлдээ нэвтэрнэ үү. Холбоос 15 минутын дараа хүчингүй болно.</p>
        <p style="font-family:sans-serif"><a href="${escapeHtml(link)}">Нэвтрэх</a></p>
        <p style="font-family:sans-serif;color:#666;font-size:13px">Хэрэв та энэ имэйлийг хүсээгүй бол үл тоомсорлоно уу.</p>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[app/auth/request]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}