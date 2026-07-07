import type { DomainOrder, Payment, ServiceOrder } from "@prisma/client";
import { db } from "@/lib/db";
import { SERVICE_TYPE_LABELS } from "@/lib/services/order-status";

export type PayableOrder =
  | {
      kind: "domain";
      order: DomainOrder;
      payment: Payment;
      description: string;
      reference: string;
    }
  | {
      kind: "service";
      order: ServiceOrder;
      payment: Payment;
      description: string;
      reference: string;
    };

export async function resolvePayableOrder(orderId: string): Promise<PayableOrder | null> {
  const domainOrder = await db.domainOrder.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (domainOrder?.payment) {
    return {
      kind: "domain",
      order: domainOrder,
      payment: domainOrder.payment,
      description: `${domainOrder.domainName} домэйн захиалга (${domainOrder.orderNumber})`,
      reference: domainOrder.domainName,
    };
  }

  const serviceOrder = await db.serviceOrder.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (serviceOrder?.payment) {
    const label = SERVICE_TYPE_LABELS[serviceOrder.serviceType];
    const ref = serviceOrder.domainName ?? `${label} ${serviceOrder.planKey}`;
    return {
      kind: "service",
      order: serviceOrder,
      payment: serviceOrder.payment,
      description: `${label} ${serviceOrder.planKey} (${serviceOrder.orderNumber})`,
      reference: ref,
    };
  }

  return null;
}