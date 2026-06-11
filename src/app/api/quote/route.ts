import { NextResponse } from "next/server";
import { quoteSchema } from "@/lib/validations";
import { sendEmail, row } from "@/lib/mail";
import { guardMutation } from "@/lib/security";
import { persist } from "@/lib/persist";

export async function POST(req: Request) {
  const { response } = guardMutation(req, { key: "quote", limit: 5, windowMs: 60_000 });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = quoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const d = parsed.data;

    await persist((db) =>
      db.lead.create({
        data: {
          name: d.name,
          email: d.email,
          phone: d.phone,
          company: d.company,
          services: d.services,
          budget: d.budget,
          timeline: d.timeline,
          details: d.details,
        },
      })
    );

    await sendEmail({
      subject: `Шинэ үнийн санал хүсэлт — ${d.name}`,
      replyTo: d.email,
      html: `
        <h2 style="font-family:sans-serif">Шинэ үнийн санал хүсэлт</h2>
        <table style="font-family:sans-serif;border-collapse:collapse">
          ${row("Үйлчилгээ", d.services)}
          ${row("Төсөв", d.budget)}
          ${row("Хугацаа", d.timeline)}
          ${row("Нэр", d.name)}
          ${row("Имэйл", d.email)}
          ${row("Утас", d.phone)}
          ${row("Байгууллага", d.company)}
          ${row("Дэлгэрэнгүй", d.details)}
        </table>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[quote]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
