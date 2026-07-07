import { NextResponse } from "next/server";
import { invalidateSearchCache } from "@/lib/domains/rdap-cache";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { parseFqdn } from "@/lib/domains/sanitize";
import {
  createDomainOrder,
  DomainConflictError,
  DomainOrderError,
  domainOrderErrorMessage,
} from "@/lib/domains/orders";
import { getBankSettings } from "@/lib/domains/bank-settings";
import { buildBankTransferInstructionsHtml } from "@/lib/domains/receipt";
import { formatDomainPrice } from "@/lib/domains/format";
import { escapeHtml, row, sendEmail } from "@/lib/mail";
import { guardMutation } from "@/lib/security";
import { domainOrderSchema } from "@/lib/validations/domains";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const { response } = await guardMutation(req, {
    key: "domain-order",
    limit: 5,
    windowMs: 60_000,
  });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = domainOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      acceptTerms: _acceptTerms,
      acceptRegistryPolicy: _acceptRegistryPolicy,
      locale: inputLocale,
      ...orderInput
    } = parsed.data;

    const locale =
      inputLocale ?? (req.headers.get("accept-language")?.startsWith("en") ? "en" : "mn");

    const { order, payment } = await createDomainOrder({
      ...orderInput,
      locale,
    });

    const label = parseFqdn(order.domainName)?.label;
    if (label) invalidateSearchCache(label);

    const priceLabel = formatDomainPrice(order.totalAmount, locale);

    await sendEmail({
      subject: `Шинэ домэйн захиалга — ${order.orderNumber}`,
      replyTo: order.customerEmail,
      html: `
        <h2 style="font-family:sans-serif">Шинэ домэйн захиалга</h2>
        <table style="font-family:sans-serif;border-collapse:collapse">
          ${row("Захиалгын дугаар", order.orderNumber)}
          ${row("Домэйн", order.domainName)}
          ${row("Дүн", priceLabel)}
          ${row("Нэр", order.customerName)}
          ${row("Имэйл", order.customerEmail)}
          ${row("Утас", order.customerPhone)}
          ${row("Байгууллага", order.company ?? undefined)}
        </table>`,
    });

    const bank = payment.method === "BANK_TRANSFER" ? await getBankSettings() : null;

    await sendEmail({
      to: order.customerEmail,
      subject:
        locale === "en"
          ? `Domain order ${order.orderNumber} — Nuul Digital`
          : `Домэйн захиалга ${order.orderNumber} — Nuul Digital`,
      html:
        payment.method === "BANK_TRANSFER" && bank
          ? buildBankTransferInstructionsHtml(order, bank)
          : locale === "en"
            ? `
        <h2 style="font-family:sans-serif">Thank you for your order</h2>
        <p style="font-family:sans-serif">Your domain <strong>${escapeHtml(order.domainName)}</strong> has been reserved.</p>
        <p style="font-family:sans-serif">Order number: <strong>${escapeHtml(order.orderNumber)}</strong></p>
        <p style="font-family:sans-serif">Total: <strong>${escapeHtml(priceLabel)}</strong></p>
        <p style="font-family:sans-serif">Complete payment within 24 hours to secure your domain via QPay.</p>
        <p style="font-family:sans-serif">Please send your registrant ID or company certificate to hello@nuul.digital within 3 business days.</p>`
            : `
        <h2 style="font-family:sans-serif">Захиалга амжилттай үүслээ</h2>
        <p style="font-family:sans-serif"><strong>${escapeHtml(order.domainName)}</strong> домэйнийг түр хадгаллаа.</p>
        <p style="font-family:sans-serif">Захиалгын дугаар: <strong>${escapeHtml(order.orderNumber)}</strong></p>
        <p style="font-family:sans-serif">Нийт дүн: <strong>${escapeHtml(priceLabel)}</strong></p>
        <p style="font-family:sans-serif">24 цагийн дотор QPay-ээр төлбөрөө төлж домэйнээ баталгаажуулна уу.</p>
        <p style="font-family:sans-serif">Бүртгэлийн бичиг баримтаа 3 ажлын өдрийн дотор hello@nuul.digital хаяг руу илгээнэ үү.</p>`,
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      domain: order.domainName,
      totalAmount: order.totalAmount,
      payment: {
        id: payment.id,
        method: payment.method,
        status: payment.status,
        expiresAt: payment.expiresAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    if (err instanceof DomainConflictError) {
      return NextResponse.json(
        { error: err.code, message: err.message },
        { status: 409 }
      );
    }
    if (err instanceof DomainOrderError) {
      const status =
        err.code === "DOMAIN_TAKEN" || err.code === "DOMAIN_RESERVED" ? 409 : 400;
      return NextResponse.json(
        { error: err.code, message: domainOrderErrorMessage(err.code) },
        { status }
      );
    }
    console.error("[domains/orders]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}