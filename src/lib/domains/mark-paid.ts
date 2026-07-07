import type { Prisma } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { createDomainInvoice } from "@/lib/billing/activate";
import { db } from "@/lib/db";
import { formatDomainPrice } from "@/lib/domains/format";
import { buildPaymentReceiptHtml } from "@/lib/domains/receipt";
import { escapeHtml, row, sendEmail } from "@/lib/mail";

export type MarkPaidOptions = {
  transactionId?: string | null;
  callbackPayload?: unknown;
  metadata?: Prisma.InputJsonValue;
};

export type MarkPaidResult = {
  alreadyPaid: boolean;
  orderId: string;
  orderNumber: string;
  domainName: string;
  amount: number;
};

/**
 * Idempotent PAID transition — used by QPay poll and webhook.
 */
export async function markOrderPaid(
  domainOrderId: string,
  opts: MarkPaidOptions = {}
): Promise<MarkPaidResult | null> {
  if (!process.env.DATABASE_URL) return null;

  const payment = await db.payment.findFirst({
    where: { domainOrderId },
    include: { domainOrder: true },
  });

  if (!payment?.domainOrder) return null;

  const order = payment.domainOrder;

  if (payment.status === "COMPLETED" && order.status === "PAID") {
    return {
      alreadyPaid: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      domainName: order.domainName,
      amount: payment.amount,
    };
  }

  if (order.status !== "PENDING_PAYMENT" && payment.status !== "PENDING") {
    return null;
  }

  const paidAt = new Date();
  const existingMeta =
    payment.metadata && typeof payment.metadata === "object" && !Array.isArray(payment.metadata)
      ? (payment.metadata as Record<string, unknown>)
      : {};

  const metadata: Prisma.InputJsonValue = {
    ...existingMeta,
    ...(typeof opts.metadata === "object" && opts.metadata !== null && !Array.isArray(opts.metadata)
      ? (opts.metadata as Record<string, unknown>)
      : {}),
    ...(opts.callbackPayload !== undefined ? { callbackPayload: opts.callbackPayload } : {}),
  };

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        transactionId: opts.transactionId ?? payment.transactionId,
        paidAt,
        metadata,
      },
    });

    await tx.domainOrder.update({
      where: { id: order.id },
      data: { status: "PAID" },
    });

    if (order.journeyId) {
      try {
        await tx.onboardingJourney.update({
          where: { id: order.journeyId },
          data: { currentStep: "DOMAIN_PURCHASED" },
        });
      } catch {
        /* journey may have been deleted */
      }
    }

    await createDomainInvoice(tx, order, payment, paidAt);
  });

  const priceLabel = formatDomainPrice(payment.amount, "mn");

  await sendEmail({
    subject: `Домэйн төлбөр хүлээн авлаа — ${order.orderNumber}`,
    replyTo: order.customerEmail,
    html: `
      <h2 style="font-family:sans-serif">Төлбөр хүлээн авлаа</h2>
      <table style="font-family:sans-serif;border-collapse:collapse">
        ${row("Захиалгын дугаар", order.orderNumber)}
        ${row("Домэйн", order.domainName)}
        ${row("Дүн", priceLabel)}
        ${row("Нэр", order.customerName)}
        ${row("Имэйл", order.customerEmail)}
      </table>
      <p style="font-family:sans-serif">Бид 24 цагийн дотор домэйнийг бүртгэнэ.</p>`,
  });

  await sendEmail({
    to: order.customerEmail,
    subject: `Төлбөр амжилттай — ${order.domainName}`,
    html: `
      <h2 style="font-family:sans-serif">Төлбөр амжилттай!</h2>
      <p style="font-family:sans-serif"><strong>${escapeHtml(order.domainName)}</strong> домэйний төлбөр хүлээн авлаа.</p>
      ${buildPaymentReceiptHtml(order, {
        method: payment.method,
        amount: payment.amount,
        paidAt,
        transactionId: opts.transactionId ?? payment.transactionId,
      })}
      <p style="font-family:sans-serif">Бид 24 цагийн дотор домэйнийг идэвхжүүлнэ. Бүртгэлийн бичиг баримтаа hello@nuul.digital руу илгээнэ үү.</p>`,
  });

  await logActivity({
    action: "UPDATE",
    entity: "DomainOrder",
    entityId: order.id,
    summary: `Төлбөр төлөгдсөн: ${order.orderNumber}`,
    metadata: { domain: order.domainName, amount: payment.amount },
  });

  return {
    alreadyPaid: false,
    orderId: order.id,
    orderNumber: order.orderNumber,
    domainName: order.domainName,
    amount: payment.amount,
  };
}