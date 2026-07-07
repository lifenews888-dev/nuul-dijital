import type { Prisma, Subscription } from "@prisma/client";
import { db } from "@/lib/db";
import { formatDomainPrice } from "@/lib/domains/format";
import { escapeHtml, row, sendEmail } from "@/lib/mail";
import { PLAN_KEY_LABELS, SERVICE_TYPE_LABELS } from "@/lib/services/order-status";

/** Days after invoice due date before service is suspended. */
export const SUSPEND_GRACE_DAYS = 7;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

type SuspendMeta = {
  suspendedAt?: string;
  suspendReason?: string;
  overdueInvoiceId?: string;
};

function getSuspendMeta(metadata: Prisma.JsonValue | null): SuspendMeta {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    return metadata as SuspendMeta;
  }
  return {};
}

export type SuspendServicesResult = {
  scanned: number;
  suspended: number;
  skipped: number;
  errors: number;
  subscriptionIds: string[];
};

/**
 * Daily job: pause subscriptions that remain unpaid past the grace period.
 */
export async function suspendOverdueServices(now = new Date()): Promise<SuspendServicesResult> {
  const graceCutoff = addDays(now, -SUSPEND_GRACE_DAYS);

  const subscriptions = await db.subscription.findMany({
    where: {
      status: "PAST_DUE",
      invoices: {
        some: {
          status: "OVERDUE",
          dueAt: { lt: graceCutoff },
        },
      },
    },
    include: {
      organization: { select: { billingEmail: true, name: true } },
      serviceOrder: { select: { domainName: true, orderNumber: true } },
      invoices: {
        where: { status: "OVERDUE" },
        orderBy: { dueAt: "asc" },
        take: 1,
      },
    },
    take: 200,
  });

  let suspended = 0;
  let skipped = 0;
  let errors = 0;
  const subscriptionIds: string[] = [];

  for (const sub of subscriptions) {
    const overdueInvoice = sub.invoices[0];
    if (!overdueInvoice) {
      skipped++;
      continue;
    }

    try {
      const existingMeta = getSuspendMeta(sub.metadata);
      if (existingMeta.suspendedAt) {
        skipped++;
        continue;
      }

      await db.subscription.update({
        where: { id: sub.id },
        data: {
          status: "PAUSED",
          metadata: {
            ...existingMeta,
            suspendedAt: now.toISOString(),
            suspendReason: "overdue_invoice",
            overdueInvoiceId: overdueInvoice.id,
          },
        },
      });

      suspended++;
      subscriptionIds.push(sub.id);
      await sendServiceSuspendedEmail(sub, overdueInvoice.number, overdueInvoice.totalMnt);
    } catch (err) {
      console.error("[billing/suspend]", sub.id, err);
      errors++;
    }
  }

  return {
    scanned: subscriptions.length,
    suspended,
    skipped,
    errors,
    subscriptionIds,
  };
}

async function sendServiceSuspendedEmail(
  sub: Subscription & {
    organization: { billingEmail: string; name: string };
    serviceOrder?: { domainName: string | null; orderNumber: string | null } | null;
  },
  invoiceNumber: string,
  amountMnt: number
): Promise<void> {
  const serviceLabel = SERVICE_TYPE_LABELS[sub.serviceType];
  const planLabel = PLAN_KEY_LABELS[sub.planKey] ?? sub.planKey;
  const priceLabel = formatDomainPrice(amountMnt, "mn");
  const domain = sub.serviceOrder?.domainName;
  const appUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nuul.digital").replace(/\/$/, "");

  await sendEmail({
    to: sub.organization.billingEmail,
    subject: `Үйлчилгээ түр зогссон — ${serviceLabel} ${planLabel}`,
    html: `
      <h2 style="font-family:sans-serif">Үйлчилгээ түр зогссон</h2>
      <p style="font-family:sans-serif">Сайн байна уу, ${escapeHtml(sub.organization.name)}.</p>
      <p style="font-family:sans-serif">Төлбөр хугацаа хэтэрсний дараа таны үйлчилгээ түр зогссон байна. Төлбөр төлсний дараа дахин идэвхжинэ.</p>
      <table style="font-family:sans-serif;border-collapse:collapse">
        ${row("Үйлчилгээ", `${serviceLabel} — ${planLabel}`)}
        ${row("Домэйн", domain ?? undefined)}
        ${row("Нэхэмжлэх", invoiceNumber)}
        ${row("Дүн", priceLabel)}
      </table>
      <p style="font-family:sans-serif">
        <a href="${appUrl}/app/billing">Төлбөр төлөх</a>
      </p>`,
  });
}