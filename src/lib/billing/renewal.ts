import type { Invoice, Payment, Prisma, Subscription } from "@prisma/client";
import { generateUniqueInvoiceNumber } from "@/lib/billing/invoice-number";
import { db } from "@/lib/db";
import { formatDomainPrice } from "@/lib/domains/format";
import { escapeHtml, row, sendEmail } from "@/lib/mail";
import { PLAN_KEY_LABELS, SERVICE_TYPE_LABELS } from "@/lib/services/order-status";

export const RENEWAL_LEAD_DAYS = 7;
const DUNNING_REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function renewalLineDescription(sub: Subscription, domainName?: string | null): string {
  const label = SERVICE_TYPE_LABELS[sub.serviceType];
  const plan = PLAN_KEY_LABELS[sub.planKey] ?? sub.planKey;
  const months = sub.billingMonths;
  const monthLabel = months === 1 ? "1 сар" : `${months} сар`;
  const domain = domainName ? ` — ${domainName}` : "";
  return `${label} — ${plan} дахин шинэчлэлт (${monthLabel})${domain}`;
}

type SubscriptionWithOrder = Subscription & {
  serviceOrder?: { domainName: string | null } | null;
  organization: { billingEmail: string; name: string };
};

export type RenewalInvoiceResult = {
  scanned: number;
  created: number;
  skipped: number;
  invoiceIds: string[];
};

export type DunningResult = {
  markedOverdue: number;
  remindersSent: number;
  errors: number;
};

export type MarkRenewalPaidResult = {
  alreadyPaid: boolean;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
};

export type MarkRenewalPaidOptions = {
  transactionId?: string | null;
  callbackPayload?: unknown;
  metadata?: Prisma.InputJsonValue;
};

/**
 * Daily job: create OPEN renewal invoices for subscriptions nearing period end.
 * Idempotent per subscription period (matches dueAt to currentPeriodEnd).
 */
export async function generateRenewalInvoices(
  now = new Date()
): Promise<RenewalInvoiceResult> {
  const windowEnd = addDays(now, RENEWAL_LEAD_DAYS);

  const subscriptions = await db.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "PAST_DUE"] },
      cancelAtPeriodEnd: false,
      currentPeriodEnd: { lte: windowEnd },
    },
    include: {
      serviceOrder: { select: { domainName: true } },
      organization: { select: { billingEmail: true, name: true } },
    },
    take: 200,
  });

  let created = 0;
  let skipped = 0;
  const invoiceIds: string[] = [];

  for (const sub of subscriptions) {
    const existing = await db.invoice.findFirst({
      where: {
        subscriptionId: sub.id,
        status: { in: ["OPEN", "OVERDUE", "PAID"] },
        dueAt: sub.currentPeriodEnd,
      },
      select: { id: true },
    });

    if (existing) {
      skipped++;
      continue;
    }

    const amountMnt = sub.unitPriceMnt * sub.billingMonths;
    const description = renewalLineDescription(sub, sub.serviceOrder?.domainName);
    const dueAt = sub.currentPeriodEnd;

    const invoice = await db.$transaction(async (tx) => {
      const number = await generateUniqueInvoiceNumber(now, tx);
      return tx.invoice.create({
        data: {
          orgId: sub.orgId,
          subscriptionId: sub.id,
          number,
          status: "OPEN",
          subtotalMnt: amountMnt,
          taxMnt: 0,
          totalMnt: amountMnt,
          currency: sub.currency,
          dueAt,
          lineItems: {
            create: {
              description,
              quantity: sub.billingMonths,
              unitPriceMnt: sub.unitPriceMnt,
              amountMnt,
              sortOrder: 0,
            },
          },
        },
      });
    });

    created++;
    invoiceIds.push(invoice.id);

    await sendRenewalInvoiceEmail(sub as SubscriptionWithOrder, invoice);
  }

  return { scanned: subscriptions.length, created, skipped, invoiceIds };
}

async function sendRenewalInvoiceEmail(
  sub: SubscriptionWithOrder,
  invoice: Invoice
): Promise<void> {
  const priceLabel = formatDomainPrice(invoice.totalMnt, "mn");
  const dueLabel = invoice.dueAt.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const appUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nuul.digital").replace(/\/$/, "");

  await sendEmail({
    to: sub.organization.billingEmail,
    subject: `Дахин шинэчлэлтийн нэхэмжлэх — ${invoice.number}`,
    html: `
      <h2 style="font-family:sans-serif">Дахин шинэчлэлтийн нэхэмжлэх</h2>
      <p style="font-family:sans-serif">Сайн байна уу, ${escapeHtml(sub.organization.name)}.</p>
      <p style="font-family:sans-serif">Таны үйлчилгээний дахин шинэчлэлтийн нэхэмжлэх бэлэн боллоо.</p>
      <table style="font-family:sans-serif;border-collapse:collapse">
        ${row("Нэхэмжлэх", invoice.number)}
        ${row("Дүн", priceLabel)}
        ${row("Төлөх хугацаа", dueLabel)}
      </table>
      <p style="font-family:sans-serif">
        <a href="${appUrl}/app/billing">Төлбөр төлөх</a> хэсгээс QPay-ээр төлнө үү.
      </p>`,
  });
}

type DunningMeta = {
  dunning?: Record<string, { lastSentAt: string; count: number }>;
};

function getDunningMeta(metadata: Prisma.JsonValue | null): DunningMeta {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as DunningMeta;
  }
  return {};
}

/**
 * Daily job: mark past-due OPEN invoices as OVERDUE and send reminder emails.
 */
export async function runDunning(now = new Date()): Promise<DunningResult> {
  const openPastDue = await db.invoice.findMany({
    where: {
      status: "OPEN",
      dueAt: { lt: now },
      subscriptionId: { not: null },
    },
    include: {
      subscription: true,
      organization: { select: { billingEmail: true, name: true } },
    },
    take: 200,
  });

  let markedOverdue = 0;
  let remindersSent = 0;
  let errors = 0;

  for (const invoice of openPastDue) {
    try {
      await db.$transaction(async (tx) => {
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status: "OVERDUE" },
        });
        if (invoice.subscriptionId) {
          await tx.subscription.update({
            where: { id: invoice.subscriptionId },
            data: { status: "PAST_DUE" },
          });
        }
      });
      markedOverdue++;
      await sendDunningEmail(invoice, invoice.organization, 1);
      remindersSent++;

      if (invoice.subscriptionId && invoice.subscription) {
        const meta = getDunningMeta(invoice.subscription.metadata);
        const dunning = { ...(meta.dunning ?? {}) };
        dunning[invoice.id] = { lastSentAt: now.toISOString(), count: 1 };
        await db.subscription.update({
          where: { id: invoice.subscriptionId },
          data: { metadata: { ...meta, dunning } },
        });
      }
    } catch (err) {
      console.error("[billing/dunning] mark overdue", invoice.id, err);
      errors++;
    }
  }

  const overdueInvoices = await db.invoice.findMany({
    where: {
      status: "OVERDUE",
      subscriptionId: { not: null },
    },
    include: {
      subscription: true,
      organization: { select: { billingEmail: true, name: true } },
    },
    take: 200,
  });

  for (const invoice of overdueInvoices) {
    if (!invoice.subscriptionId || !invoice.subscription) continue;

    const meta = getDunningMeta(invoice.subscription.metadata);
    const entry = meta.dunning?.[invoice.id];
    const lastSent = entry?.lastSentAt ? new Date(entry.lastSentAt).getTime() : 0;
    if (now.getTime() - lastSent < DUNNING_REMINDER_INTERVAL_MS) continue;

    try {
      const count = (entry?.count ?? 0) + 1;
      await sendDunningEmail(invoice, invoice.organization, count);
      remindersSent++;

      const dunning = { ...(meta.dunning ?? {}) };
      dunning[invoice.id] = { lastSentAt: now.toISOString(), count };
      await db.subscription.update({
        where: { id: invoice.subscriptionId },
        data: { metadata: { ...meta, dunning } },
      });
    } catch (err) {
      console.error("[billing/dunning] reminder", invoice.id, err);
      errors++;
    }
  }

  return { markedOverdue, remindersSent, errors };
}

async function sendDunningEmail(
  invoice: Invoice,
  org: { billingEmail: string; name: string },
  attempt: number
): Promise<void> {
  const priceLabel = formatDomainPrice(invoice.totalMnt, "mn");
  const dueLabel = invoice.dueAt.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const appUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nuul.digital").replace(/\/$/, "");
  const subject =
    attempt === 1
      ? `Төлбөрийн хугацаа хэтэрсэн — ${invoice.number}`
      : `Төлбөрийн сануулга (${attempt}) — ${invoice.number}`;

  await sendEmail({
    to: org.billingEmail,
    subject,
    html: `
      <h2 style="font-family:sans-serif">Төлбөрийн сануулга</h2>
      <p style="font-family:sans-serif">Сайн байна уу, ${escapeHtml(org.name)}.</p>
      <p style="font-family:sans-serif">Дараах нэхэмжлэхийн төлөх хугацаа хэтэрсэн байна. Үйлчилгээ тасалдахаас сэргийлж төлнө үү.</p>
      <table style="font-family:sans-serif;border-collapse:collapse">
        ${row("Нэхэмжлэх", invoice.number)}
        ${row("Дүн", priceLabel)}
        ${row("Төлөх хугацаа", dueLabel)}
      </table>
      <p style="font-family:sans-serif">
        <a href="${appUrl}/app/billing">Төлбөр төлөх</a>
      </p>`,
  });
}

/**
 * Idempotent: marks a renewal invoice paid and extends the subscription period.
 */
export async function markRenewalInvoicePaid(
  paymentId: string,
  opts: MarkRenewalPaidOptions = {}
): Promise<MarkRenewalPaidResult | null> {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      invoice: {
        include: {
          subscription: { include: { organization: { select: { billingEmail: true, name: true } } } },
          lineItems: true,
        },
      },
    },
  });

  if (!payment?.invoice) return null;

  const invoice = payment.invoice;
  const subscription = invoice.subscription;

  if (payment.status === "COMPLETED" && invoice.status === "PAID") {
    return {
      alreadyPaid: true,
      invoiceId: invoice.id,
      invoiceNumber: invoice.number,
      amount: payment.amount,
    };
  }

  if (invoice.status !== "OPEN" && invoice.status !== "OVERDUE") return null;
  if (payment.status !== "PENDING" && payment.status !== "PROCESSING") return null;

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

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "PAID", paidAt },
    });

    if (subscription) {
      const newStart = subscription.currentPeriodEnd;
      const newEnd = addMonths(newStart, subscription.billingMonths);
      const subMeta =
        subscription.metadata &&
        typeof subscription.metadata === "object" &&
        !Array.isArray(subscription.metadata)
          ? { ...(subscription.metadata as Record<string, unknown>) }
          : {};
      delete subMeta.suspendedAt;
      delete subMeta.suspendReason;
      delete subMeta.overdueInvoiceId;

      await tx.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          currentPeriodStart: newStart,
          currentPeriodEnd: newEnd,
          metadata: subMeta as Prisma.InputJsonValue,
        },
      });
    }
  });

  const priceLabel = formatDomainPrice(payment.amount, "mn");
  const org = subscription?.organization;
  const primaryLine = invoice.lineItems[0]?.description ?? "Дахин шинэчлэлт";

  if (org) {
    await sendEmail({
      to: org.billingEmail,
      subject: `Дахин шинэчлэлт амжилттай — ${invoice.number}`,
      html: `
        <h2 style="font-family:sans-serif">Төлбөр хүлээн авлаа</h2>
        <p style="font-family:sans-serif">Сайн байна уу, ${escapeHtml(org.name)}.</p>
        <table style="font-family:sans-serif;border-collapse:collapse">
          ${row("Нэхэмжлэх", invoice.number)}
          ${row("Үйлчилгээ", primaryLine)}
          ${row("Дүн", priceLabel)}
        </table>
        <p style="font-family:sans-serif">Таны үйлчилгээ дахин шинэчлэгдлээ. Баярлалаа!</p>`,
    });
  }

  return {
    alreadyPaid: false,
    invoiceId: invoice.id,
    invoiceNumber: invoice.number,
    amount: payment.amount,
  };
}