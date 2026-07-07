import type { InvoiceStatus, ServiceType, SubscriptionStatus } from "@prisma/client";

export type PublicInvoiceLineItem = {
  description: string;
  quantity: number;
  unitPriceMnt: number;
  amountMnt: number;
};

export type PublicInvoiceSummary = {
  id: string;
  number: string;
  status: InvoiceStatus;
  subtotalMnt: number;
  taxMnt: number;
  totalMnt: number;
  currency: string;
  dueAt: string;
  paidAt: string | null;
  createdAt: string;
  lineItems: PublicInvoiceLineItem[];
  serviceOrderId: string | null;
  domainOrderId: string | null;
  subscriptionId: string | null;
  payable: boolean;
};

export type PublicSubscriptionSummary = {
  id: string;
  serviceType: ServiceType;
  planKey: string;
  status: SubscriptionStatus;
  unitPriceMnt: number;
  billingMonths: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  serviceOrderId: string | null;
  domainName: string | null;
};

export type PublicBillingSummary = {
  subscriptions: PublicSubscriptionSummary[];
  invoices: PublicInvoiceSummary[];
};