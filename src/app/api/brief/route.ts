import { NextResponse } from "next/server";
import { briefSchema } from "@/lib/validations";
import { sendEmail, row } from "@/lib/mail";
import { guardMutation } from "@/lib/security";
import { persist } from "@/lib/persist";
import { estimateBrief, formatMnt } from "@/lib/estimate";

const yn = (v: boolean | null | undefined) => (v === true ? "Тийм" : v === false ? "Үгүй" : "—");
const domainLabel: Record<string, string> = {
  HAVE: "Байгаа",
  BUY: "Худалдаж авна",
  SUGGEST: "Санал болгосон нэр",
};

export async function POST(req: Request) {
  const { response } = guardMutation(req, { key: "brief", limit: 5, windowMs: 60_000 });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = briefSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const d = parsed.data;
    const estimate = estimateBrief(d);

    await persist((db) =>
      db.projectBrief.create({
        data: {
          estimateMin: estimate.min,
          estimateMax: estimate.max,
          name: d.name,
          phone: d.phone ?? "",
          email: d.email,
          company: d.company,
          location: d.location,
          social: d.social,
          services: d.services,
          projectTypes: d.projectTypes,
          domainStatus: d.domainStatus,
          domainName: d.domainName,
          hosting: d.hosting ?? null,
          hasLogo: d.hasLogo ?? null,
          about: d.about ?? "",
          goal: d.goal ?? "",
          audience: d.audience,
          colors: d.colors,
          pages: d.pages,
          features: d.features,
          needsAuth: d.needsAuth ?? null,
          references: d.references,
          timeline: d.timeline,
          budget: d.budget,
          notes: d.notes,
        },
      })
    );

    await sendEmail({
      subject: `🎨 Шинэ загвар сайт хүсэлт — ${d.name}`,
      replyTo: d.email,
      html: `
        <h2 style="font-family:sans-serif">Шинэ төслийн бриф</h2>
        <p style="font-family:sans-serif;font-size:16px"><strong>Автомат урьдчилсан үнэлгээ:</strong>
          ${formatMnt(estimate.min)} – ${formatMnt(estimate.max)}
          <em style="color:#888">(админд батлуулна)</em></p>
        <table style="font-family:sans-serif;border-collapse:collapse">
          ${row("Нэр", d.name)}
          ${row("Утас", d.phone)}
          ${row("Имэйл", d.email)}
          ${row("Байгууллага", d.company)}
          ${row("Байршил", d.location)}
          ${row("Сошиал", d.social)}
          ${row("Үйлчилгээ", d.services)}
          ${row("Төслийн төрөл", d.projectTypes)}
          ${row("Домэйн", d.domainStatus ? domainLabel[d.domainStatus] ?? d.domainStatus : undefined)}
          ${row("Домэйн нэр", d.domainName)}
          ${row("Хостинг", yn(d.hosting))}
          ${row("Лого", yn(d.hasLogo))}
          ${row("Танилцуулга", d.about)}
          ${row("Гол зорилго", d.goal)}
          ${row("Зорилтот хэрэглэгч", d.audience)}
          ${row("Өнгөний хослол", d.colors)}
          ${row("Хуудаснууд", d.pages)}
          ${row("Функцууд", d.features)}
          ${row("Бүртгэлийн хэсэг", yn(d.needsAuth))}
          ${row("Лавлагаа сайтууд", d.references)}
          ${row("Хугацаа", d.timeline)}
          ${row("Төсөв", d.budget)}
          ${row("Нэмэлт тэмдэглэл", d.notes)}
        </table>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[brief]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
