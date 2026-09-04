import { NextResponse } from "next/server";
import { softwareQuoteSchema } from "@/lib/validations";
import { sendEmail, row } from "@/lib/mail";
import { guardMutation } from "@/lib/security";
import { persist } from "@/lib/persist";

export async function POST(req: Request) {
  const { response } = await guardMutation(req, {
    key: "software-quote",
    limit: 5,
    windowMs: 60_000,
  });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = softwareQuoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const { website, ...d } = parsed.data;
    // A filled honeypot means a bot: accept the request so it stops retrying,
    // but drop it before it reaches the inbox or the database.
    if (website) return NextResponse.json({ ok: true });

    await persist((db) =>
      db.softwareQuote.create({
        data: {
          company: d.company,
          regNumber: d.regNumber,
          contactName: d.contactName,
          email: d.email,
          phone: d.phone,
          vendor: d.vendor,
          products: d.products,
          seats: d.seats,
          term: d.term,
          message: d.message,
        },
      })
    );

    await sendEmail({
      subject: `Лицензийн хүсэлт — ${d.company}`,
      replyTo: d.email,
      html: `
        <h2 style="font-family:sans-serif">Программ хангамжийн лицензийн хүсэлт</h2>
        <table style="font-family:sans-serif;border-collapse:collapse">
          ${row("Байгууллага", d.company)}
          ${row("ТТД", d.regNumber)}
          ${row("Холбоо барих", d.contactName)}
          ${row("Имэйл", d.email)}
          ${row("Утас", d.phone)}
          ${row("Үйлдвэрлэгч", d.vendor)}
          ${row("Бүтээгдэхүүн", d.products)}
          ${row("Хэрэглэгчийн тоо", d.seats ? String(d.seats) : undefined)}
          ${row("Хугацаа", d.term)}
          ${row("Нэмэлт", d.message)}
        </table>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[software-quote]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
