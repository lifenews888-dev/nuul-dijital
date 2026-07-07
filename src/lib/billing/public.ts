import type { Invoice, InvoiceLineItem, Subscription } from "@prisma/client";
import type { PublicInvoiceSummary, PublicSubscriptionSummary } from "@/lib/billing/types";

type InvoiceWithLines = Invoice & { lineItems: InvoiceLineItem[] };
type SubscriptionWithOrder = Subscription & {
  serviceOrder?: { domainName: string | null } | null;
};

export function toPublicSubscriptionSummary(
  sub: SubscriptionWithOrder
): PublicSubscriptionSummary {
  return {
    id: sub.id,
    serviceType: sub.serviceType,
    planKey: sub.planKey,
    status: sub.status,
    unitPriceMnt: sub.unitPriceMnt,
    billingMonths: sub.billingMonths,
    currency: sub.currency,
    currentPeriodStart: sub.currentPeriodStart.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    serviceOrderId: sub.serviceOrderId,
    domainName: sub.serviceOrder?.domainName ?? null,
  };
}

export function toPublicInvoiceSummary(invoice: InvoiceWithLines): PublicInvoiceSummary {
  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    subtotalMnt: invoice.subtotalMnt,
    taxMnt: invoice.taxMnt,
    totalMnt: invoice.totalMnt,
    currency: invoice.currency,
    dueAt: invoice.dueAt.toISOString(),
    paidAt: invoice.paidAt?.toISOString() ?? null,
    createdAt: invoice.createdAt.toISOString(),
    serviceOrderId: invoice.serviceOrderId,
    domainOrderId: invoice.domainOrderId,
    lineItems: invoice.lineItems
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPriceMnt: item.unitPriceMnt,
        amountMnt: item.amountMnt,
      })),
  };
}