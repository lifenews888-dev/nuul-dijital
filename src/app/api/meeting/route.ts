import { NextResponse } from "next/server";
import { meetingSchema } from "@/lib/validations";
import { sendEmail, row } from "@/lib/mail";
import { guardMutation } from "@/lib/security";
import { persist } from "@/lib/persist";

export async function POST(req: Request) {
  const { response } = guardMutation(req, { key: "meeting", limit: 5, windowMs: 60_000 });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = meetingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const d = parsed.data;

    await persist((db) =>
      db.meeting.create({
        data: {
          name: d.name,
          email: d.email,
          phone: d.phone,
          company: d.company,
          preferredAt: d.preferredAt,
          topic: d.topic,
          message: d.message,
        },
      })
    );

    await sendEmail({
      subject: `Шинэ уулзалтын хүсэлт — ${d.name}`,
      replyTo: d.email,
      html: `
        <h2 style="font-family:sans-serif">Шинэ уулзалтын хүсэлт</h2>
        <table style="font-family:sans-serif;border-collapse:collapse">
          ${row("Нэр", d.name)}
          ${row("Имэйл", d.email)}
          ${row("Утас", d.phone)}
          ${row("Байгууллага", d.company)}
          ${row("Тохирох цаг", d.preferredAt)}
          ${row("Сэдэв", d.topic)}
          ${row("Тэмдэглэл", d.message)}
        </table>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[meeting]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
