import { NextResponse } from "next/server";
import {
  createMagicLinkToken,
  normalizeLookupEmail,
} from "@/lib/domains/order-lookup";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { escapeHtml, sendEmail } from "@/lib/mail";
import { persist } from "@/lib/persist";
import { siteConfig } from "@/lib/site";
import { guardMutation } from "@/lib/security";
import { orderLookupRequestSchema } from "@/lib/validations/orders";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const { response } = await guardMutation(req, {
    key: "order-lookup-request",
    limit: 5,
    windowMs: 60_000,
  });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = orderLookupRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const email = normalizeLookupEmail(parsed.data.email);
    const locale =
      parsed.data.locale ??
      (req.headers.get("accept-language")?.startsWith("en") ? "en" : "mn");

    const emailFilter = { equals: email, mode: "insensitive" as const };

    const counts = await persist(async (database) => {
      const [domains, services] = await Promise.all([
        database.domainOrder.count({ where: { customerEmail: emailFilter } }),
        database.serviceOrder.count({ where: { customerEmail: emailFilter } }),
      ]);
      return { domains, services };
    });

    if (counts && counts.domains + counts.services > 0) {
      const token = createMagicLinkToken(email);
      const base = siteConfig.url.replace(/\/$/, "");
      const localePath = locale === "en" ? "/en" : "";
      const link = `${base}/api/orders/lookup/verify?token=${encodeURIComponent(token)}&locale=${locale}`;

      await sendEmail({
        to: email,
        subject:
          locale === "en"
            ? "View your Nuul Digital orders"
            : "Nuul Digital захиалгаа харах",
        html:
          locale === "en"
            ? `
        <h2 style="font-family:sans-serif">Your order history</h2>
        <p style="font-family:sans-serif">Click the link below to view your orders. This link expires in 15 minutes.</p>
        <p style="font-family:sans-serif"><a href="${escapeHtml(link)}">View my orders</a></p>
        <p style="font-family:sans-serif;color:#666;font-size:13px">If you did not request this email, you can ignore it.</p>`
            : `
        <h2 style="font-family:sans-serif">Таны захиалгууд</h2>
        <p style="font-family:sans-serif">Доорх холбоосоор захиалгаа харна уу. Холбоос 15 минутын дараа хүчингүй болно.</p>
        <p style="font-family:sans-serif"><a href="${escapeHtml(link)}">Захиалгаа харах</a></p>
        <p style="font-family:sans-serif;color:#666;font-size:13px">Хэрэв та энэ имэйлийг хүсээгүй бол үл тоомсорлоно уу.</p>`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[orders/lookup/request]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}