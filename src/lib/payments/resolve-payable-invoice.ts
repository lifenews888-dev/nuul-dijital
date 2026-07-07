import type { Invoice, InvoiceLineItem, Payment } from "@prisma/client";
import { db } from "@/lib/db";

export type PayableInvoice = {
  invoice: Invoice & { lineItems: InvoiceLineItem[] };
  payment: Payment | null;
  description: string;
  reference: string;
};

export async function resolvePayableInvoice(
  invoiceId: string,
  orgId: string
): Promise<PayableInvoice | null> {
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, orgId },
    include: {
      lineItems: true,
      payment: true,
      subscription: { include: { serviceOrder: { select: { domainName: true } } } },
    },
  });

  if (!invoice) return null;
  if (invoice.status !== "OPEN" && invoice.status !== "OVERDUE") return null;
  if (!invoice.subscriptionId) return null;

  const primaryLine = invoice.lineItems.sort((a, b) => a.sortOrder - b.sortOrder)[0];
  const domainName = invoice.subscription?.serviceOrder?.domainName;
  const description = primaryLine?.description ?? `Нэхэмжлэх ${invoice.number}`;
  const reference = domainName ?? invoice.number;

  return {
    invoice,
    payment: invoice.payment,
    description,
    reference,
  };
}