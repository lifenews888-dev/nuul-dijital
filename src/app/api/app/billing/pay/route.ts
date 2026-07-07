import { NextResponse } from "next/server";
import { z } from "zod";
import { getAppContext } from "@/lib/app";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import {
  createInvoice as createQPayInvoice,
  getQPayCallbackUrl,
  isQPayConfigured,
} from "@/lib/payments/qpay";
import { resolvePayableInvoice } from "@/lib/payments/resolve-payable-invoice";
import { db } from "@/lib/db";
import { getSiteFlag } from "@/lib/settings";
import { guardMutation } from "@/lib/security";

export const runtime = "nodejs";

const paySchema = z.object({
  invoiceId: z.string().cuid(),
});

function addHours(date: Date, hours: number): Date {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result;
}

export async function POST(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const qpayEnabled = await getSiteFlag("domains_qpay_enabled", "true");
  if (!qpayEnabled) {
    return NextResponse.json(
      { error: "QPAY_DISABLED", message: "QPay төлбөр одоогоор идэвхгүй байна" },
      { status: 503 }
    );
  }

  if (!isQPayConfigured()) {
    return NextResponse.json(
      { error: "QPAY_NOT_CONFIGURED", message: "QPay тохиргоо дутуу байна" },
      { status: 503 }
    );
  }

  const ctx = await getAppContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { response } = await guardMutation(req, {
    key: `app-billing-pay:${ctx.user.id}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = paySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const payable = await resolvePayableInvoice(parsed.data.invoiceId, ctx.organization.id);
    if (!payable) {
      return NextResponse.json(
        { error: "INVOICE_NOT_PAYABLE", message: "Нэхэмжлэх олдсонгүй эсвэл төлж болохгүй" },
        { status: 404 }
      );
    }

    const { invoice, payment, description, reference } = payable;

    let activePayment = payment;

    if (activePayment?.status === "COMPLETED") {
      return NextResponse.json(
        { error: "INVOICE_ALREADY_PAID", message: "Нэхэмжлэх аль хэдийн төлөгдсөн" },
        { status: 400 }
      );
    }

    if (
      activePayment?.qpayInvoiceId &&
      activePayment.qpayQrImage &&
      activePayment.status === "PENDING" &&
      (!activePayment.expiresAt || activePayment.expiresAt > new Date())
    ) {
      return NextResponse.json({
        invoiceId: activePayment.qpayInvoiceId,
        qrImage: activePayment.qpayQrImage,
        qrText: null,
        shortUrl: activePayment.qpayShortUrl,
        deeplinks: [],
        amount: activePayment.amount,
        billingInvoiceNumber: invoice.number,
        reference,
        reused: true,
      });
    }

    if (!activePayment) {
      activePayment = await db.payment.create({
        data: {
          method: "QPAY",
          amount: invoice.totalMnt,
          status: "PENDING",
          expiresAt: addHours(new Date(), 24),
        },
      });

      await db.invoice.update({
        where: { id: invoice.id },
        data: { paymentId: activePayment.id },
      });
    } else if (activePayment.expiresAt && activePayment.expiresAt < new Date()) {
      activePayment = await db.payment.update({
        where: { id: activePayment.id },
        data: {
          status: "EXPIRED",
          qpayInvoiceId: null,
          qpayQrImage: null,
          qpayShortUrl: null,
        },
      });

      const freshPayment = await db.payment.create({
        data: {
          method: "QPAY",
          amount: invoice.totalMnt,
          status: "PENDING",
          expiresAt: addHours(new Date(), 24),
        },
      });

      await db.invoice.update({
        where: { id: invoice.id },
        data: { paymentId: freshPayment.id },
      });
      activePayment = freshPayment;
    }

    const qpayInvoice = await createQPayInvoice({
      orderId: invoice.number,
      amount: activePayment.amount,
      description,
      callbackUrl: getQPayCallbackUrl(),
    });

    await db.payment.update({
      where: { id: activePayment.id },
      data: {
        qpayInvoiceId: qpayInvoice.invoice_id,
        qpayQrImage: qpayInvoice.qr_image,
        qpayShortUrl: qpayInvoice.qPay_shortUrl,
        method: "QPAY",
        status: "PENDING",
        expiresAt: addHours(new Date(), 24),
      },
    });

    return NextResponse.json({
      invoiceId: qpayInvoice.invoice_id,
      qrImage: qpayInvoice.qr_image,
      qrText: qpayInvoice.qr_text,
      shortUrl: qpayInvoice.qPay_shortUrl,
      deeplinks: qpayInvoice.urls,
      amount: activePayment.amount,
      billingInvoiceNumber: invoice.number,
      reference,
      reused: false,
    });
  } catch (err) {
    console.error("[app/billing/pay]", err);
    const message = err instanceof Error ? err.message : "QPay алдаа";
    return NextResponse.json({ error: "QPAY_ERROR", message }, { status: 500 });
  }
}