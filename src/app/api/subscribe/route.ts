import { NextResponse } from "next/server";
import { subscribeSchema } from "@/lib/validations";
import { sendEmail, row } from "@/lib/mail";
import { guardMutation } from "@/lib/security";
import { persist } from "@/lib/persist";

export async function POST(req: Request) {
  const { response } = await guardMutation(req, { key: "subscribe", limit: 5, windowMs: 60_000 });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    const { email } = parsed.data;

    await persist((db) =>
      db.subscriber.upsert({ where: { email }, update: { active: true }, create: { email } })
    );

    await sendEmail({
      subject: `Шинэ имэйл бүртгэл — ${email}`,
      html: `<table>${row("Имэйл", email)}</table>`,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
