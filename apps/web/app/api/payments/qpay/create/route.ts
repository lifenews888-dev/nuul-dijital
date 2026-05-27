import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createInvoice } from "@/lib/qpay";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    }

    const { orderId, amount, description } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json({ error: "orderId, amount шаардлагатай" }, { status: 400 });
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: (session.user as { id: string }).id,
        status: "PENDING",
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });
    }

    const callbackUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/api/payments/qpay/callback`;

    const invoice = await createInvoice({
      orderId,
      amount: order.amount,
      description: description || `nuul.digital — Захиалга #${orderId.slice(0, 8)}`,
      callbackUrl,
    });

    // Save/update payment record
    await prisma.payment.upsert({
      where: { orderId },
      update: {
        qpayInvoiceId: invoice.invoice_id,
        qpayQrCode: invoice.qr_image,
        method: "QPAY",
        amount: order.amount,
      },
      create: {
        orderId,
        method: "QPAY",
        amount: order.amount,
        status: "PENDING",
        qpayInvoiceId: invoice.invoice_id,
        qpayQrCode: invoice.qr_image,
      },
    });

    return NextResponse.json({
      success: true,
      invoiceId: invoice.invoice_id,
      qrImage: invoice.qr_image,
      qrText: invoice.qr_text,
      shortUrl: invoice.qPay_shortUrl,
      deeplinks: invoice.urls,
    });
  } catch (error) {
    console.error("[QPAY_CREATE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "QPay нэхэмжлэх үүсгэхэд алдаа" },
      { status: 500 },
    );
  }
}
