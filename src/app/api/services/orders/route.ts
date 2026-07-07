import { NextResponse } from "next/server";
import { getAppContext } from "@/lib/app";
import { requireDomainsModule, requireServiceOrdersEnabled } from "@/lib/domains/module-guard";
import { getBankSettings } from "@/lib/domains/bank-settings";
import { formatDomainPrice } from "@/lib/domains/format";
import { escapeHtml, row, sendEmail } from "@/lib/mail";
import {
  createServiceOrder,
  ServiceOrderError,
  serviceOrderErrorMessage,
} from "@/lib/services/orders";
import { buildServiceBankTransferHtml } from "@/lib/services/receipt";
import { SERVICE_TYPE_LABELS } from "@/lib/services/order-status";
import { guardMutation } from "@/lib/security";
import { serviceOrderSchema } from "@/lib/validations/services";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const moduleDisabled = await requireDomainsModule();
  if (moduleDisabled) return moduleDisabled;

  const ordersDisabled = await requireServiceOrdersEnabled();
  if (ordersDisabled) return ordersDisabled;

  const { response } = await guardMutation(req, {
    key: "service-order",
    limit: 5,
    windowMs: 60_000,
  });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = serviceOrderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      acceptTerms: _acceptTerms,
      locale: inputLocale,
      domainName: rawDomain,
      ...orderInput
    } = parsed.data;

    const locale =
      inputLocale ?? (req.headers.get("accept-language")?.startsWith("en") ? "en" : "mn");

    const domainName = rawDomain?.trim() || undefined;
    const appCtx = await getAppContext();

    const { order, payment } = await createServiceOrder({
      ...orderInput,
      domainName,
      locale,
      orgId: appCtx?.organization.id,
      userId: appCtx?.user.id,
    });

    const serviceLabel = SERVICE_TYPE_LABELS[order.serviceType];
    const priceLabel = formatDomainPrice(order.totalAmount, locale);

    await sendEmail({
      subject: `Шинэ ${serviceLabel} захиалга — ${order.orderNumber}`,
      replyTo: order.customerEmail,
      html: `
        <h2 style="font-family:sans-serif">Шинэ үйлчилгээний захиалга</h2>
        <table style="font-family:sans-serif;border-collapse:collapse">
          ${row("Захиалгын дугаар", order.orderNumber)}
          ${row("Үйлчилгээ", serviceLabel)}
          ${row("Багц", order.planKey)}
          ${row("Дүн", priceLabel)}
          ${row("Нэр", order.customerName)}
          ${row("Имэйл", order.customerEmail)}
          ${row("Утас", order.customerPhone)}
          ${row("Домэйн", order.domainName ?? undefined)}
        </table>`,
    });

    const bank = payment.method === "BANK_TRANSFER" ? await getBankSettings() : null;

    await sendEmail({
      to: order.customerEmail,
      subject:
        locale === "en"
          ? `${serviceLabel} order ${order.orderNumber} — Nuul Digital`
          : `${serviceLabel} захиалга ${order.orderNumber} — Nuul Digital`,
      html:
        payment.method === "BANK_TRANSFER" && bank
          ? buildServiceBankTransferHtml(order, bank)
          : locale === "en"
            ? `
        <h2 style="font-family:sans-serif">Thank you for your order</h2>
        <p style="font-family:sans-serif">Your <strong>${escapeHtml(serviceLabel)}</strong> (${escapeHtml(order.planKey)}) order is reserved.</p>
        <p style="font-family:sans-serif">Order number: <strong>${escapeHtml(order.orderNumber)}</strong></p>
        <p style="font-family:sans-serif">Total: <strong>${escapeHtml(priceLabel)}</strong></p>
        <p style="font-family:sans-serif">Complete payment within 24 hours via QPay.</p>`
            : `
        <h2 style="font-family:sans-serif">Захиалга амжилттай үүслээ</h2>
        <p style="font-family:sans-serif"><strong>${escapeHtml(serviceLabel)}</strong> (${escapeHtml(order.planKey)}) захиалга үүслээ.</p>
        <p style="font-family:sans-serif">Захиалгын дугаар: <strong>${escapeHtml(order.orderNumber)}</strong></p>
        <p style="font-family:sans-serif">Нийт дүн: <strong>${escapeHtml(priceLabel)}</strong></p>
        <p style="font-family:sans-serif">24 цагийн дотор QPay-ээр төлбөрөө төлнө үү.</p>`,
    });

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      serviceType: order.serviceType,
      planKey: order.planKey,
      totalAmount: order.totalAmount,
      payment: {
        id: payment.id,
        method: payment.method,
        status: payment.status,
        expiresAt: payment.expiresAt?.toISOString() ?? null,
      },
    });
  } catch (err) {
    if (err instanceof ServiceOrderError) {
      return NextResponse.json(
        { error: err.code, message: serviceOrderErrorMessage(err.code) },
        { status: 400 }
      );
    }
    console.error("[services/orders]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}