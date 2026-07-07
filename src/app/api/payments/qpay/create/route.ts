import { NextResponse } from "next/server";
import { z } from "zod";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import {
  createInvoice,
  getQPayCallbackUrl,
  isQPayConfigured,
} from "@/lib/payments/qpay";
import { resolvePayableOrder } from "@/lib/payments/resolve-payable-order";
import { db } from "@/lib/db";
import { getSiteFlag } from "@/lib/settings";
import { guardMutation } from "@/lib/security";

export const runtime = "nodejs";

const createSchema = z.object({
  orderId: z.string().cuid(),
});

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

  const { response } = await guardMutation(req, {
    key: "qpay-create",
    limit: 10,
    windowMs: 60_000,
  });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const payable = await resolvePayableOrder(parsed.data.orderId);
    if (!payable) {
      return NextResponse.json({ error: "ORDER_NOT_FOUND", message: "Захиалга олдсонгүй" }, { status: 404 });
    }

    const { order, payment, description } = payable;

    if (order.status === "PAID") {
      return NextResponse.json(
        { error: "ORDER_ALREADY_PAID", message: "Захиалга аль хэдийн төлөгдсөн" },
        { status: 400 }
      );
    }

    if (order.status !== "PENDING_PAYMENT") {
      return NextResponse.json(
        { error: "ORDER_NOT_PAYABLE", message: "Энэ захиалгыг төлж болохгүй" },
        { status: 400 }
      );
    }

    if (payment.status === "COMPLETED") {
      return NextResponse.json(
        { error: "PAYMENT_COMPLETED", message: "Төлбөр аль хэдийн төлөгдсөн" },
        { status: 400 }
      );
    }

    if (payment.expiresAt && payment.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "PAYMENT_EXPIRED", message: "Төлбөрийн хугацаа дууссан" },
        { status: 400 }
      );
    }

    if (payment.qpayInvoiceId && payment.qpayQrImage && payment.status === "PENDING") {
      return NextResponse.json({
        invoiceId: payment.qpayInvoiceId,
        qrImage: payment.qpayQrImage,
        qrText: null,
        shortUrl: payment.qpayShortUrl,
        deeplinks: [],
        amount: payment.amount,
        reused: true,
      });
    }

    const invoice = await createInvoice({
      orderId: order.orderNumber,
      amount: payment.amount,
      description,
      callbackUrl: getQPayCallbackUrl(),
    });

    await db.payment.update({
      where: { id: payment.id },
      data: {
        qpayInvoiceId: invoice.invoice_id,
        qpayQrImage: invoice.qr_image,
        qpayShortUrl: invoice.qPay_shortUrl,
        method: "QPAY",
        status: "PENDING",
      },
    });

    return NextResponse.json({
      invoiceId: invoice.invoice_id,
      qrImage: invoice.qr_image,
      qrText: invoice.qr_text,
      shortUrl: invoice.qPay_shortUrl,
      deeplinks: invoice.urls,
      amount: payment.amount,
      reused: false,
    });
  } catch (err) {
    console.error("[qpay/create]", err);
    const message = err instanceof Error ? err.message : "QPay алдаа";
    return NextResponse.json({ error: "QPAY_ERROR", message }, { status: 500 });
  }
}