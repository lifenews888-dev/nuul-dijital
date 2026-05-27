import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Нэвтрэх шаардлагатай" },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;

    const accounts = await prisma.hostingAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error("[HOSTING_ACCOUNTS]", error);
    return NextResponse.json(
      { error: "Хостинг дансны жагсаалт авахад алдаа гарлаа" },
      { status: 500 },
    );
  }
}
