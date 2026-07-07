import { db } from "@/lib/db";
import { invalidateSearchCache } from "@/lib/domains/rdap-cache";
import { buildOrderExpiredEmailHtml } from "@/lib/domains/receipt";
import { sendEmail } from "@/lib/mail";
import { cancelInvoice, isQPayConfigured } from "@/lib/payments/qpay";

const FALLBACK_TTL_MS = 24 * 60 * 60 * 1000;

export type ExpirePaymentsResult = {
  expired: number;
  errors: number;
};

/**
 * Expire stale PENDING payments and release domain reservations.
 * Safe to run hourly via cron (idempotent per payment row).
 */
export async function expireStalePayments(): Promise<ExpirePaymentsResult> {
  if (!process.env.DATABASE_URL) {
    return { expired: 0, errors: 0 };
  }

  const now = new Date();
  const fallbackCutoff = new Date(now.getTime() - FALLBACK_TTL_MS);

  const staleWhere = {
    status: "PENDING" as const,
    OR: [{ expiresAt: { lt: now } }, { expiresAt: null, createdAt: { lt: fallbackCutoff } }],
  };

  const [domainStale, serviceStale] = await Promise.all([
    db.payment.findMany({
      where: {
        ...staleWhere,
        domainOrder: { status: "PENDING_PAYMENT" },
      },
      include: { domainOrder: true },
    }),
    db.payment.findMany({
      where: {
        ...staleWhere,
        serviceOrder: { status: "PENDING_PAYMENT" },
      },
      include: { serviceOrder: true },
    }),
  ]);

  let expired = 0;
  let errors = 0;

  for (const payment of domainStale) {
    if (!payment.domainOrder || !payment.domainOrderId) continue;
    try {
      if (payment.qpayInvoiceId && isQPayConfigured()) {
        await cancelInvoice(payment.qpayInvoiceId).catch((err) => {
          console.error("[expire-payments] cancelInvoice", payment.qpayInvoiceId, err);
        });
      }

      await db.$transaction([
        db.payment.update({
          where: { id: payment.id },
          data: { status: "EXPIRED" },
        }),
        db.domainOrder.update({
          where: { id: payment.domainOrderId },
          data: { status: "EXPIRED" },
        }),
      ]);

      invalidateSearchCache(payment.domainOrder.domainLabel);

      await sendEmail({
        subject: `Төлбөрийн хугацаа дууссан — ${payment.domainOrder.orderNumber}`,
        replyTo: payment.domainOrder.customerEmail,
        html: buildOrderExpiredEmailHtml(payment.domainOrder),
      });

      await sendEmail({
        to: payment.domainOrder.customerEmail,
        subject: `Захиалгын хугацаа дууссан — ${payment.domainOrder.domainName}`,
        html: buildOrderExpiredEmailHtml(payment.domainOrder),
      });

      expired++;
    } catch (err) {
      errors++;
      console.error("[expire-payments]", payment.id, err);
    }
  }

  for (const payment of serviceStale) {
    if (!payment.serviceOrder || !payment.serviceOrderId) continue;
    try {
      if (payment.qpayInvoiceId && isQPayConfigured()) {
        await cancelInvoice(payment.qpayInvoiceId).catch((err) => {
          console.error("[expire-payments] cancelInvoice", payment.qpayInvoiceId, err);
        });
      }

      await db.$transaction([
        db.payment.update({
          where: { id: payment.id },
          data: { status: "EXPIRED" },
        }),
        db.serviceOrder.update({
          where: { id: payment.serviceOrderId },
          data: { status: "EXPIRED" },
        }),
      ]);

      const order = payment.serviceOrder;
      const subject = `Төлбөрийн хугацаа дууссан — ${order.orderNumber}`;
      const html = `
        <h2 style="font-family:sans-serif">Захиалгын хугацаа дууссан</h2>
        <p style="font-family:sans-serif">Таны ${order.serviceType === "HOSTING" ? "хостинг" : "имэйл"} захиалга (${order.orderNumber}) 24 цагийн дотор төлбөргүй болсон тул цуцлагдлаа.</p>
        <p style="font-family:sans-serif">Дахин захиалах бол nuul.digital руу зочилно уу.</p>`;

      await sendEmail({ subject, replyTo: order.customerEmail, html });
      await sendEmail({ to: order.customerEmail, subject, html });

      expired++;
    } catch (err) {
      errors++;
      console.error("[expire-payments/service]", payment.id, err);
    }
  }

  return { expired, errors };
}