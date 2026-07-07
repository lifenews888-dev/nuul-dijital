import { NextResponse } from "next/server";
import { markRenewalInvoicePaid } from "@/lib/billing/renewal";
import { markOrderPaid } from "@/lib/domains/mark-paid";
import { markServiceOrderPaid } from "@/lib/services/mark-paid";
import { checkPayment, isQPayConfigured } from "@/lib/payments/qpay";
import { db } from "@/lib/db";

export const runtime = "nodejs";

/** QPay server webhook — NO guardMutation, NO requireDomainsModule */
export async function POST(req: Request) {
  if (!isQPayConfigured()) {
    return NextResponse.json({ error: "QPAY_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const invoiceId = body.invoice_id as string | undefined;

    if (!invoiceId) {
      return NextResponse.json({ error: "invoice_id required" }, { status: 400 });
    }

    const payment = await db.payment.findFirst({
      where: { qpayInvoiceId: invoiceId },
      include: { invoice: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    if (payment.status === "COMPLETED") {
      return NextResponse.json({ success: true });
    }

    const result = await checkPayment(invoiceId);

    if (result.count > 0 && result.paid_amount > 0) {
      if (result.paid_amount < payment.amount) {
        return NextResponse.json({ error: "underpaid" }, { status: 400 });
      }

      const firstRow = result.rows[0];
      const markOpts = {
        transactionId: firstRow?.transaction_id ?? firstRow?.payment_id ?? null,
        callbackPayload: body,
      };
      if (payment.serviceOrderId) {
        await markServiceOrderPaid(payment.serviceOrderId, markOpts);
      } else if (payment.domainOrderId) {
        await markOrderPaid(payment.domainOrderId, markOpts);
      } else if (payment.invoice) {
        await markRenewalInvoicePaid(payment.id, markOpts);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[qpay/callback]", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}

/** QPay may probe with GET for URL verification */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}