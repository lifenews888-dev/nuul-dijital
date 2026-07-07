import type { JourneyStep } from "@prisma/client";
import { NextResponse } from "next/server";
import { sendEmail, row } from "@/lib/mail";
import { persist } from "@/lib/persist";
import { guardMutation } from "@/lib/security";
import { serviceWaitlistSchema } from "@/lib/validations";

const SERVICE_LABELS: Record<string, string> = {
  hosting: "Хостинг",
  email: "Бизнес имэйл",
  ssl: "SSL",
};

const JOURNEY_STEPS: Partial<Record<string, JourneyStep>> = {
  hosting: "HOSTING_SELECTED",
  email: "EMAIL_CONFIGURED",
};

export async function POST(req: Request) {
  const { response } = await guardMutation(req, { key: "service-waitlist", limit: 5, windowMs: 60_000 });
  if (response) return response;

  try {
    const body = await req.json();
    const parsed = serviceWaitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const d = parsed.data;
    const serviceLabel = SERVICE_LABELS[d.service] ?? d.service;
    const details = [
      `Үйлчилгээ: ${serviceLabel}`,
      d.plan ? `Төлөвлөгөө: ${d.plan}` : null,
      d.journeyId ? `Journey: ${d.journeyId}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    await persist((db) =>
      db.lead.create({
        data: {
          name: d.name ?? d.email.split("@")[0],
          email: d.email,
          services: [serviceLabel],
          details,
          status: "NEW",
        },
      })
    );

    if (d.journeyId && JOURNEY_STEPS[d.service]) {
      await persist(async (db) => {
        try {
          await db.onboardingJourney.update({
            where: { id: d.journeyId },
            data: { currentStep: JOURNEY_STEPS[d.service] },
          });
        } catch {
          /* journey may have been deleted */
        }
      });
    }

    await sendEmail({
      subject: `⏳ ${serviceLabel} waitlist — ${d.email}`,
      replyTo: d.email,
      html: `
        <h2 style="font-family:sans-serif">Шинэ waitlist бүртгэл</h2>
        <table style="font-family:sans-serif;border-collapse:collapse">
          ${row("Үйлчилгээ", serviceLabel)}
          ${row("Төлөвлөгөө", d.plan)}
          ${row("Имэйл", d.email)}
          ${row("Нэр", d.name)}
          ${row("Journey ID", d.journeyId)}
        </table>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[service-waitlist]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}