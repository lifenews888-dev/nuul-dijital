import { NextResponse } from "next/server";
import { markRenewalInvoicePaid } from "@/lib/billing/renewal";
import { markOrderPaid } from "@/lib/domains/mark-paid";
import { markServiceOrderPaid } from "@/lib/services/mark-paid";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { checkPayment, isQPayConfigured } from "@/lib/payments/qpay";
import { db } from "@/lib/db";
import { guardMutation } from "@/lib/security";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  if (!isQPayConfigured()) {
    return NextResponse.json(
      { error: "QPAY_NOT_CONFIGURED", message: "QPay тохиргоо дутуу байна" },
      { status: 503 }
    );
  }

  const { response } = await guardMutation(req, {
    key: "qpay-check",
    limit: 30,
    windowMs: 60_000,
  });
  if (response) return response;

  const invoiceId = new URL(req.url).searchParams.get("invoiceId");
  if (!invoiceId) {
    return NextResponse.json({ error: "invoiceId required" }, { status: 400 });
  }

  try {
    const payment = await db.payment.findFirst({
      where: { qpayInvoiceId: invoiceId },
      include: { domainOrder: true, serviceOrder: true, invoice: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "PAYMENT_NOT_FOUND" }, { status: 404 });
    }

    const orderId = payment.domainOrderId ?? payment.serviceOrderId;
    const orderNumber =
      payment.domainOrder?.orderNumber ?? payment.serviceOrder?.orderNumber ?? null;
    const billingInvoiceNumber = payment.invoice?.number ?? null;

    if (payment.status === "COMPLETED") {
      return NextResponse.json({
        paid: true,
        status: "COMPLETED",
        orderId,
        orderNumber,
        billingInvoiceNumber,
        kind: payment.invoice ? "renewal" : orderId ? "order" : null,
      });
    }

    const result = await checkPayment(invoiceId);

    if (result.count > 0 && result.paid_amount > 0) {
      if (result.paid_amount < payment.amount) {
        return NextResponse.json({ error: "underpaid", paid: false }, { status: 400 });
      }

      const firstRow = result.rows[0];
      const markOpts = {
        transactionId: firstRow?.transaction_id ?? firstRow?.payment_id ?? null,
        metadata: { qpayCheck: result as object },
      };

      const marked = payment.serviceOrderId
        ? await markServiceOrderPaid(payment.serviceOrderId, markOpts)
        : payment.domainOrderId
          ? await markOrderPaid(payment.domainOrderId, markOpts)
          : payment.invoice
            ? await markRenewalInvoicePaid(payment.id, markOpts)
            : null;

      return NextResponse.json({
        paid: true,
        status: "COMPLETED",
        amount: result.paid_amount,
        transactionId: firstRow?.transaction_id,
        orderId: marked && "orderId" in marked ? marked.orderId : orderId,
        orderNumber: marked && "orderNumber" in marked ? marked.orderNumber : orderNumber,
        billingInvoiceNumber:
          marked && "invoiceNumber" in marked
            ? marked.invoiceNumber
            : billingInvoiceNumber,
        kind: payment.invoice ? "renewal" : orderId ? "order" : null,
      });
    }

    return NextResponse.json({
      paid: false,
      status: payment.status,
      orderId,
    });
  } catch (err) {
    console.error("[qpay/check]", err);
    const message = err instanceof Error ? err.message : "Check failed";
    return NextResponse.json({ error: "QPAY_ERROR", message }, { status: 500 });
  }
}