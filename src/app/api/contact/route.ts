import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations";
import { sendEmail, row } from "@/lib/mail";
import { guardMutation } from "@/lib/security";
import { persist } from "@/lib/persist";

export async function POST(req: Request) {
  const { response } = await guardMutation(req, { key: "contact", limit: 5, windowMs: 60_000 });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { name, email, phone, company, message } = parsed.data;

    // Persist (best-effort — never blocks the user if the DB is unavailable).
    await persist((db) =>
      db.contactMessage.create({ data: { name, email, phone, company, message } })
    );

    await sendEmail({
      subject: `Шинэ холбоо барих хүсэлт — ${name}`,
      replyTo: email,
      html: `
        <h2 style="font-family:sans-serif">Шинэ холбоо барих хүсэлт</h2>
        <table style="font-family:sans-serif;border-collapse:collapse">
          ${row("Нэр", name)}
          ${row("Имэйл", email)}
          ${row("Утас", phone)}
          ${row("Байгууллага", company)}
          ${row("Зурвас", message)}
        </table>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
