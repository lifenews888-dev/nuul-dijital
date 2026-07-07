import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app";
import { getBankSettings } from "@/lib/domains/bank-settings";
import { formatDomainPrice } from "@/lib/domains/format";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import {
  createDomainRenewalOrder,
  DomainRenewalError,
  domainRenewalErrorMessage,
} from "@/lib/domains/renewals";
import { buildBankTransferInstructionsHtml } from "@/lib/domains/receipt";
import { escapeHtml, row, sendEmail } from "@/lib/mail";
import { guardMutation } from "@/lib/security";
import { domainRenewalSchema } from "@/lib/validations/domains";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const { response } = await guardMutation(req, {
    key: "domain-renewal",
    limit: 5,
    windowMs: 60_000,
  });
  if (response) return response;

  const ctx = await getAppContext();
  if (!ctx) {
    return NextResponse.json(
      {
        error: "AUTH_REQUIRED",
        message: "Домэйн шинэчлэхийн өмнө бүртгэлдээ нэвтэрнэ үү.",
      },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const parsed = domainRenewalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const locale =
      parsed.data.locale ??
      (req.headers.get("accept-language")?.startsWith("en") ? "en" : "mn");

    const { acceptTerms: _acceptTerms, ...renewalInput } = parsed.data;

    const { order, payment, sourceOrder } = await createDomainRenewalOrder({
      ...renewalInput,
      orgId: ctx.organization.id,
      userId: ctx.user.id,
      customerEmail: ctx.user.email,
    });

    const priceLabel = formatDomainPrice(order.totalAmount, locale);
    const expiresLabel =
      sourceOrder.domainExpiresAt?.toLocaleDateString(locale === "en" ? "en-US" : "mn-MN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }) ?? "";

    await sendEmail({
      subject: `Домэйн шинэчлэлтийн захиалга — ${order.orderNumber}`,
      replyTo: order.customerEmail,
      html: `
        <h2 style="font-family:sans-serif">Домэйн шинэчлэлт</h2>
        <table style="font-family:sans-serif;border-collapse:collapse">
          ${row("Захиалгын дугаар", order.orderNumber)}
          ${row("Домэйн", order.domainName)}
          ${row("Хугацаа", `${order.years} жил`)}
          ${row("Одоогийн дуусах", expiresLabel)}
          ${row("Дүн", priceLabel)}
        </table>`,
    });

    const bank = payment.method === "BANK_TRANSFER" ? await getBankSettings() : null;

    await sendEmail({
      to: order.customerEmail,
      subject:
        locale === "en"
          ? `Domain renewal ${order.orderNumber} — Nuul Digital`
          : `Домэйн шинэчлэлт ${order.orderNumber} — Nuul Digital`,
      html:
        payment.method === "BANK_TRANSFER" && bank
          ? buildBankTransferInstructionsHtml(order, bank)
          : locale === "en"
            ? `
        <h2 style="font-family:sans-serif">Renewal order created</h2>
        <p style="font-family:sans-serif">Renew <strong>${escapeHtml(order.domainName)}</strong> for <strong>${order.years}</strong> year(s).</p>
        <p style="font-family:sans-serif">Order: <strong>${escapeHtml(order.orderNumber)}</strong></p>
        <p style="font-family:sans-serif">Total: <strong>${escapeHtml(priceLabel)}</strong></p>
        <p style="font-family:sans-serif">Complete payment within 24 hours via QPay.</p>`
            : `
        <h2 style="font-family:sans-serif">Шинэчлэлтийн захиалга үүслээ</h2>
        <p style="font-family:sans-serif"><strong>${escapeHtml(order.domainName)}</strong> домэйнийг <strong>${order.years} жил</strong>-ээр шинэчлэнэ.</p>
        <p style="font-family:sans-serif">Захиалгын дугаар: <strong>${escapeHtml(order.orderNumber)}</strong></p>
        <p style="font-family:sans-serif">Нийт дүн: <strong>${escapeHtml(priceLabel)}</strong></p>
        <p style="font-family:sans-serif">24 цагийн дотор QPay-ээр төлбөрөө төлнө үү.</p>`,
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      domain: order.domainName,
      years: order.years,
      totalAmount: order.totalAmount,
      renewPriceMnt: order.unitPrice,
      sourceOrderId: sourceOrder.id,
      payment: {
        id: payment.id,
        method: payment.method,
        status: payment.status,
        expiresAt: payment.expiresAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    if (err instanceof DomainRenewalError) {
      const status = err.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        { error: err.code, message: domainRenewalErrorMessage(err.code) },
        { status }
      );
    }
    console.error("[domains/renewals]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}