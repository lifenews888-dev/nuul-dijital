import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";

// GET — current user profile
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      image: true,
      role: true,
      createdAt: true,
      _count: {
        select: { domains: true, orders: true, subscriptions: true },
      },
    },
  });

  return NextResponse.json({ user });
}

// PATCH — update profile
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Нэвтрэх шаардлагатай" }, { status: 401 });
  }

  const body = await req.json();
  const { action } = body;

  // Update name/phone
  if (action === "update_profile") {
    const { name, phone } = body;
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
      },
    });
    return NextResponse.json({ success: true });
  }

  // Change password
  if (action === "change_password") {
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Бүх талбарыг бөглөнө үү" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Нууц үг хамгийн багадаа 8 тэмдэгт" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password) {
      return NextResponse.json({ error: "Google-ээр нэвтэрсэн бол нууц үг байхгүй" }, { status: 400 });
    }

    const valid = await compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Одоогийн нууц үг буруу" }, { status: 400 });
    }

    const hashed = await hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true });
  }

  // Update email
  if (action === "change_email") {
    const { newEmail, password } = body;

    if (!newEmail || !password) {
      return NextResponse.json({ error: "Имэйл болон нууц үг оруулна уу" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password) {
      return NextResponse.json({ error: "Google-ээр нэвтэрсэн бол нууц үг шаардлагагүй" }, { status: 400 });
    }

    const valid = await compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Нууц үг буруу" }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email: newEmail.toLowerCase() } });
    if (exists) {
      return NextResponse.json({ error: "Энэ имэйл хаяг ашиглагдаж байна" }, { status: 409 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { email: newEmail.toLowerCase() },
    });

    return NextResponse.json({ success: true });
  }

  // Delete account
  if (action === "delete_account") {
    const { password, confirm } = body;

    if (confirm !== "УСТГАХ") {
      return NextResponse.json({ error: "'УСТГАХ' гэж бичнэ үү" }, { status: 400 });
    }

    if (password) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (user?.password) {
        const valid = await compare(password, user.password);
        if (!valid) {
          return NextResponse.json({ error: "Нууц үг буруу" }, { status: 400 });
        }
      }
    }

    // Soft delete — just clear personal data
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: "Устгагдсан", email: `deleted-${session.user.id}@nuul.digital`, password: null, phone: null },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });
}
