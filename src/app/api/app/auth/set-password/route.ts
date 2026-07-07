import { NextResponse } from "next/server";
import { getAppUser } from "@/lib/app";
import { verifyPasswordResetToken } from "@/lib/domains/order-lookup";
import { requireDomainsModule } from "@/lib/domains/module-guard";
import { db } from "@/lib/db";
import { hashPassword, isPasswordStrongEnough, verifyPassword } from "@/lib/password";
import { guardMutation } from "@/lib/security";
import { appSetPasswordSchema } from "@/lib/validations/app";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const disabled = await requireDomainsModule();
  if (disabled) return disabled;

  const { response } = await guardMutation(req, {
    key: "app-auth-set-password",
    limit: 10,
    windowMs: 60_000,
  });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = appSetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, currentPassword, newPassword } = parsed.data;

    if (!isPasswordStrongEnough(newPassword)) {
      return NextResponse.json({ error: "WEAK_PASSWORD" }, { status: 400 });
    }

    let userId: string | null = null;

    if (token) {
      const email = verifyPasswordResetToken(token);
      if (!email) {
        return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
      }
      const user = await db.user.findUnique({ where: { email } });
      if (!user || user.role !== "USER" || !user.active) {
        return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
      }
      userId = user.id;
    } else {
      const sessionUser = await getAppUser();
      if (!sessionUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const user = await db.user.findUnique({ where: { id: sessionUser.id } });
      if (!user?.passwordHash) {
        // First-time password set while logged in (magic link only before)
      } else if (!currentPassword) {
        return NextResponse.json({ error: "CURRENT_REQUIRED" }, { status: 400 });
      } else {
        const valid = await verifyPassword(currentPassword, user.passwordHash);
        if (!valid) {
          return NextResponse.json({ error: "WRONG_PASSWORD" }, { status: 400 });
        }
      }
      userId = sessionUser.id;
    }

    const passwordHash = await hashPassword(newPassword);
    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[app/auth/set-password]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}