import {
  toPublicDomainOrderSummary,
  toPublicServiceOrderSummary,
  type PublicOrderSummary,
} from "@/lib/domains/order-lookup-public";
import { isDomainRenewable } from "@/lib/domains/renewals";
import { db } from "@/lib/db";

export async function fetchOrganizationOrders(orgId: string): Promise<PublicOrderSummary[]> {
  const [domainOrders, serviceOrders] = await Promise.all([
    db.domainOrder.findMany({
      where: { orgId },
      include: {
        payment: true,
        tldProduct: { select: { renewPrice: true, minYears: true, maxYears: true, status: true } },
        renewalOrders: {
          where: { status: "PENDING_PAYMENT" },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.serviceOrder.findMany({
      where: { orgId },
      include: { payment: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return [
    ...domainOrders.map((order) => {
      const pendingRenewalOrderId = order.renewalOrders[0]?.id ?? null;
      const renewPriceMnt =
        order.tldProduct.status === "ACTIVE" ? order.tldProduct.renewPrice : null;
      const renewable =
        !order.renewalSourceOrderId &&
        isDomainRenewable(order) &&
        renewPriceMnt !== null &&
        !pendingRenewalOrderId;

      return toPublicDomainOrderSummary({
        ...order,
        renewable,
      });
    }),
    ...serviceOrders.map(toPublicServiceOrderSummary),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}