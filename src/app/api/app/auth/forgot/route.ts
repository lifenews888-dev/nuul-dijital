import { NextResponse } from "next/server";
import {
  createPasswordResetToken,
  normalizeLookupEmail,
} from "@/lib/domains/order-lookup";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { db } from "@/lib/db";
import { escapeHtml, sendEmail } from "@/lib/mail";
import { guardMutation } from "@/lib/security";
import { siteConfig } from "@/lib/site";
import { appForgotPasswordSchema } from "@/lib/validations/app";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const { response } = await guardMutation(req, {
    key: "app-auth-forgot",
    limit: 5,
    windowMs: 60_000,
  });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = appForgotPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = normalizeLookupEmail(parsed.data.email);
    const locale =
      parsed.data.locale ??
      (req.headers.get("accept-language")?.startsWith("en") ? "en" : "mn");

    // Always return ok — do not reveal whether the email exists
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, role: true, passwordHash: true },
    });

    if (user?.role === "USER" && user.passwordHash) {
      const token = createPasswordResetToken(email);
      const base = siteConfig.url.replace(/\/$/, "");
      const link = `${base}/app/set-password?token=${encodeURIComponent(token)}`;

      await sendEmail({
        to: email,
        subject:
          locale === "en"
            ? "Reset your Nuul Digital password"
            : "Nuul Digital нууц үг сэргээх",
        html:
          locale === "en"
            ? `
        <h2 style="font-family:sans-serif">Reset your password</h2>
        <p style="font-family:sans-serif">Click below to set a new password. This link expires in 1 hour.</p>
        <p style="font-family:sans-serif"><a href="${escapeHtml(link)}">Reset password</a></p>
        <p style="font-family:sans-serif;color:#666;font-size:13px">If you did not request this, ignore this email.</p>`
            : `
        <h2 style="font-family:sans-serif">Нууц үг сэргээх</h2>
        <p style="font-family:sans-serif">Шинэ нууц үг тохируулахын тулд доорх холбоосыг дарна уу. Холбоос 1 цагийн дараа хүчингүй болно.</p>
        <p style="font-family:sans-serif"><a href="${escapeHtml(link)}">Нууц үг солих</a></p>
        <p style="font-family:sans-serif;color:#666;font-size:13px">Хэрэв та хүсээгүй бол үл тоомсорлоно уу.</p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[app/auth/forgot]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}