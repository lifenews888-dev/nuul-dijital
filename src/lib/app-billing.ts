import { toPublicInvoiceSummary, toPublicSubscriptionSummary } from "@/lib/billing/public";
import type { PublicBillingSummary } from "@/lib/billing/types";
import { db } from "@/lib/db";

export async function fetchOrganizationBilling(orgId: string): Promise<PublicBillingSummary> {
  const [subscriptions, invoices] = await Promise.all([
    db.subscription.findMany({
      where: { orgId },
      include: { serviceOrder: { select: { domainName: true } } },
      orderBy: { currentPeriodEnd: "desc" },
      take: 50,
    }),
    db.invoice.findMany({
      where: { orgId },
      include: { lineItems: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return {
    subscriptions: subscriptions.map(toPublicSubscriptionSummary),
    invoices: invoices.map(toPublicInvoiceSummary),
  };
}