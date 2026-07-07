import type { DomainOrder, Payment, Prisma, ServiceOrder } from "@prisma/client";
import { generateUniqueInvoiceNumber } from "@/lib/billing/invoice-number";
import { ensureCustomerUser, ensurePersonalOrganization } from "@/lib/organizations";
import { PLAN_KEY_LABELS, SERVICE_TYPE_LABELS } from "@/lib/services/order-status";

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function serviceLineDescription(order: ServiceOrder): string {
  const label = SERVICE_TYPE_LABELS[order.serviceType];
  const plan = PLAN_KEY_LABELS[order.planKey] ?? order.planKey;
  const months = order.billingMonths;
  const monthLabel = months === 1 ? "1 сар" : `${months} сар`;
  const domain = order.domainName ? ` — ${order.domainName}` : "";
  return `${label} — ${plan} (${monthLabel})${domain}`;
}

function domainLineDescription(order: DomainOrder): string {
  const years = order.years;
  const yearLabel = years === 1 ? "1 жил" : `${years} жил`;
  if (order.renewalSourceOrderId) {
    return `Домэйн шинэчлэлт — ${order.domainName} (${yearLabel})`;
  }
  return `Домэйн бүртгэл — ${order.domainName} (${yearLabel})`;
}

async function resolveOrgIdForOrder(
  tx: Prisma.TransactionClient,
  order: { id: string; orgId: string | null; userId: string | null; customerEmail: string },
  kind: "service" | "domain"
): Promise<string> {
  if (order.orgId) return order.orgId;

  const user = await ensureCustomerUser(order.customerEmail);
  const org = await ensurePersonalOrganization(user);

  if (kind === "service") {
    await tx.serviceOrder.update({
      where: { id: order.id },
      data: { orgId: org.id, userId: user.id },
    });
  } else {
    await tx.domainOrder.update({
      where: { id: order.id },
      data: { orgId: org.id, userId: user.id },
    });
  }

  return org.id;
}

/**
 * Idempotent: creates Subscription + paid Invoice when a service order is paid.
 */
export async function activateServiceSubscription(
  tx: Prisma.TransactionClient,
  order: ServiceOrder,
  payment: Payment,
  paidAt: Date
): Promise<void> {
  const existingInvoice = await tx.invoice.findUnique({
    where: { paymentId: payment.id },
    select: { id: true },
  });
  if (existingInvoice) return;

  const orgId = await resolveOrgIdForOrder(tx, order, "service");

  let subscription = await tx.subscription.findUnique({
    where: { serviceOrderId: order.id },
  });

  if (!subscription) {
    const periodEnd = addMonths(paidAt, order.billingMonths);
    subscription = await tx.subscription.create({
      data: {
        orgId,
        serviceOrderId: order.id,
        serviceType: order.serviceType,
        planKey: order.planKey,
        status: "ACTIVE",
        unitPriceMnt: order.unitPrice,
        billingMonths: order.billingMonths,
        currency: order.currency,
        currentPeriodStart: paidAt,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  const invoiceNumber = await generateUniqueInvoiceNumber(paidAt, tx);
  const description = serviceLineDescription(order);

  await tx.invoice.create({
    data: {
      orgId,
      subscriptionId: subscription.id,
      serviceOrderId: order.id,
      number: invoiceNumber,
      status: "PAID",
      subtotalMnt: payment.amount,
      taxMnt: 0,
      totalMnt: payment.amount,
      currency: order.currency,
      dueAt: paidAt,
      paidAt,
      paymentId: payment.id,
      lineItems: {
        create: {
          description,
          quantity: order.billingMonths,
          unitPriceMnt: order.unitPrice,
          amountMnt: payment.amount,
          sortOrder: 0,
        },
      },
    },
  });
}

/**
 * Idempotent: creates a one-time paid Invoice for a domain order.
 */
export async function createDomainInvoice(
  tx: Prisma.TransactionClient,
  order: DomainOrder,
  payment: Payment,
  paidAt: Date
): Promise<void> {
  const existingInvoice = await tx.invoice.findUnique({
    where: { paymentId: payment.id },
    select: { id: true },
  });
  if (existingInvoice) return;

  const orgId = await resolveOrgIdForOrder(tx, order, "domain");
  const invoiceNumber = await generateUniqueInvoiceNumber(paidAt, tx);
  const description = domainLineDescription(order);

  await tx.invoice.create({
    data: {
      orgId,
      domainOrderId: order.id,
      number: invoiceNumber,
      status: "PAID",
      subtotalMnt: payment.amount,
      taxMnt: 0,
      totalMnt: payment.amount,
      currency: order.currency,
      dueAt: paidAt,
      paidAt,
      paymentId: payment.id,
      lineItems: {
        create: {
          description,
          quantity: order.years,
          unitPriceMnt: order.unitPrice,
          amountMnt: payment.amount,
          sortOrder: 0,
        },
      },
    },
  });
}