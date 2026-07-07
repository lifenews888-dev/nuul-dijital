import type { Prisma } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { formatDomainPrice } from "@/lib/domains/format";
import { escapeHtml, row, sendEmail } from "@/lib/mail";
import { SERVICE_TYPE_LABELS } from "@/lib/services/order-status";

export type MarkServicePaidOptions = {
  transactionId?: string | null;
  callbackPayload?: unknown;
  metadata?: Prisma.InputJsonValue;
};

export type MarkServicePaidResult = {
  alreadyPaid: boolean;
  orderId: string;
  orderNumber: string;
  serviceType: string;
  planKey: string;
  amount: number;
};

/**
 * Idempotent PAID transition for hosting/email service orders.
 */
export async function markServiceOrderPaid(
  serviceOrderId: string,
  opts: MarkServicePaidOptions = {}
): Promise<MarkServicePaidResult | null> {
  if (!process.env.DATABASE_URL) return null;

  const payment = await db.payment.findFirst({
    where: { serviceOrderId },
    include: { serviceOrder: true },
  });

  if (!payment?.serviceOrder) return null;

  const order = payment.serviceOrder;

  if (payment.status === "COMPLETED" && order.status === "PAID") {
    return {
      alreadyPaid: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      serviceType: order.serviceType,
      planKey: order.planKey,
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

    await tx.serviceOrder.update({
      where: { id: order.id },
      data: { status: "PAID" },
    });
  });

  const serviceLabel = SERVICE_TYPE_LABELS[order.serviceType];
  const priceLabel = formatDomainPrice(payment.amount, "mn");

  await sendEmail({
    subject: `${serviceLabel} төлбөр хүлээн авлаа — ${order.orderNumber}`,
    replyTo: order.customerEmail,
    html: `
      <h2 style="font-family:sans-serif">Төлбөр хүлээн авлаа</h2>
      <table style="font-family:sans-serif;border-collapse:collapse">
        ${row("Захиалгын дугаар", order.orderNumber)}
        ${row("Үйлчилгээ", serviceLabel)}
        ${row("Багц", order.planKey)}
        ${row("Дүн", priceLabel)}
        ${row("Нэр", order.customerName)}
        ${row("Имэйл", order.customerEmail)}
      </table>
      <p style="font-family:sans-serif">Бид 24 цагийн дотор үйлчилгээг тохируулна.</p>`,
  });

  await sendEmail({
    to: order.customerEmail,
    subject: `Төлбөр амжилттай — ${serviceLabel} ${order.planKey}`,
    html: `
      <h2 style="font-family:sans-serif">Төлбөр амжилттай!</h2>
      <p style="font-family:sans-serif"><strong>${escapeHtml(serviceLabel)}</strong> (${escapeHtml(order.planKey)}) төлбөр хүлээн авлаа.</p>
      <p style="font-family:sans-serif">Захиалгын дугаар: <strong>${escapeHtml(order.orderNumber)}</strong></p>
      <p style="font-family:sans-serif">Нийт дүн: <strong>${escapeHtml(priceLabel)}</strong></p>
      <p style="font-family:sans-serif">Бид 24 цагийн дотор таны үйлчилгээг идэвхжүүлнэ.</p>`,
  });

  await logActivity({
    action: "UPDATE",
    entity: "ServiceOrder",
    entityId: order.id,
    summary: `Төлбөр төлөгдсөн: ${order.orderNumber}`,
    metadata: { serviceType: order.serviceType, planKey: order.planKey, amount: payment.amount },
  });

  return {
    alreadyPaid: false,
    orderId: order.id,
    orderNumber: order.orderNumber,
    serviceType: order.serviceType,
    planKey: order.planKey,
    amount: payment.amount,
  };
}