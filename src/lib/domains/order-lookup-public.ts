import type { DomainOrder, Payment, ServiceOrder, ServiceType } from "@prisma/client";

export type PublicPaymentSummary = {
  method: Payment["method"];
  status: Payment["status"];
  expiresAt: string | null;
  paidAt: string | null;
};

export type PublicDomainOrderSummary = {
  kind: "domain";
  id: string;
  orderNumber: string;
  domainName: string;
  years: number;
  totalAmount: number;
  currency: string;
  status: DomainOrder["status"];
  createdAt: string;
  fulfilledAt: string | null;
  domainExpiresAt: string | null;
  payment: PublicPaymentSummary | null;
  isRenewal: boolean;
  renewable: boolean;
  renewPriceMnt: number | null;
  minYears: number;
  maxYears: number;
  pendingRenewalOrderId: string | null;
};

export type PublicServiceOrderSummary = {
  kind: "service";
  id: string;
  orderNumber: string;
  serviceType: ServiceType;
  planKey: string;
  domainName: string | null;
  billingMonths: number;
  totalAmount: number;
  currency: string;
  status: ServiceOrder["status"];
  createdAt: string;
  provisionedAt: string | null;
  payment: PublicPaymentSummary | null;
};

export type PublicOrderSummary = PublicDomainOrderSummary | PublicServiceOrderSummary;

type OrderWithPayment = DomainOrder & { payment: Payment | null };
type ServiceOrderWithPayment = ServiceOrder & { payment: Payment | null };

function toPublicPayment(payment: Payment | null): PublicPaymentSummary | null {
  if (!payment) return null;
  return {
    method: payment.method,
    status: payment.status,
    expiresAt: payment.expiresAt?.toISOString() ?? null,
    paidAt: payment.paidAt?.toISOString() ?? null,
  };
}

type DomainOrderPublicInput = OrderWithPayment & {
  renewalSourceOrderId?: string | null;
  tldProduct?: { renewPrice: number; minYears: number; maxYears: number; status: string };
  renewalOrders?: { id: string }[];
  renewable?: boolean;
};

export function toPublicDomainOrderSummary(order: DomainOrderPublicInput): PublicDomainOrderSummary {
  const renewPriceMnt =
    order.tldProduct?.status === "ACTIVE" ? order.tldProduct.renewPrice : null;
  const pendingRenewalOrderId = order.renewalOrders?.[0]?.id ?? null;

  return {
    kind: "domain",
    id: order.id,
    orderNumber: order.orderNumber,
    domainName: order.domainName,
    years: order.years,
    totalAmount: order.totalAmount,
    currency: order.currency,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    fulfilledAt: order.fulfilledAt?.toISOString() ?? null,
    domainExpiresAt: order.domainExpiresAt?.toISOString() ?? null,
    payment: toPublicPayment(order.payment),
    isRenewal: Boolean(order.renewalSourceOrderId),
    renewPriceMnt,
    minYears: order.tldProduct?.minYears ?? 1,
    maxYears: order.tldProduct?.maxYears ?? 5,
    pendingRenewalOrderId,
    renewable: order.renewable ?? false,
  };
}

export function toPublicServiceOrderSummary(order: ServiceOrderWithPayment): PublicServiceOrderSummary {
  return {
    kind: "service",
    id: order.id,
    orderNumber: order.orderNumber,
    serviceType: order.serviceType,
    planKey: order.planKey,
    domainName: order.domainName,
    billingMonths: order.billingMonths,
    totalAmount: order.totalAmount,
    currency: order.currency,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    provisionedAt: order.provisionedAt?.toISOString() ?? null,
    payment: toPublicPayment(order.payment),
  };
}

/** @deprecated Use toPublicDomainOrderSummary */
export function toPublicOrderSummary(order: OrderWithPayment): PublicDomainOrderSummary {
  return toPublicDomainOrderSummary(order);
}