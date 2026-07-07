import {
  toPublicDomainOrderSummary,
  toPublicServiceOrderSummary,
  type PublicOrderSummary,
} from "@/lib/domains/order-lookup-public";
import { db } from "@/lib/db";

export async function fetchOrganizationOrders(orgId: string): Promise<PublicOrderSummary[]> {
  const [domainOrders, serviceOrders] = await Promise.all([
    db.domainOrder.findMany({
      where: { orgId },
      include: { payment: true },
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
    ...domainOrders.map(toPublicDomainOrderSummary),
    ...serviceOrders.map(toPublicServiceOrderSummary),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}