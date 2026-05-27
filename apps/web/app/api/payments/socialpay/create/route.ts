import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createSocialPayInvoice } from "@/lib/socialpay";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: "orderId шаардлагатай" }, { status: 400 });
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: (session.user as { id: string }).id,
        status: "PENDING",
      },
      include: { domain: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Захиалга олдсонгүй" }, { status: 404 });
    }

    const description = order.domain
      ? `${order.domain.name} домэйн захиалга`
      : `nuul.digital — Захиалга #${orderId.slice(0, 8)}`;

    const invoice = await createSocialPayInvoice({
      orderId,
      amount: order.amount,
      description,
    });

    // Save/update payment record
    await prisma.payment.upsert({
      where: { orderId },
      update: {
        method: "SOCIALPAY",
        amount: order.amount,
        transactionId: invoice.invoice,
      },
      create: {
        orderId,
        method: "SOCIALPAY",
        amount: order.amount,
        status: "PENDING",
        transactionId: invoice.invoice,
      },
    });

    return NextResponse.json({
      success: true,
      invoice: invoice.invoice,
      checksum: invoice.checksum,
      amount: invoice.amount,
      redirectUrl: invoice.redirectUrl,
    });
  } catch (error) {
    console.error("[SOCIALPAY_CREATE]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "SocialPay нэхэмжлэх үүсгэхэд алдаа" },
      { status: 500 },
    );
  }
}
