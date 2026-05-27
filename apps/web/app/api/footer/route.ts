import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Cache for 10s only — admin edits should propagate quickly
export const revalidate = 10;

export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany({
      where: { group: { in: ["contact", "general"] } },
    });

    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return NextResponse.json({
      phone: map.contact_phone || "+976 7700-1234",
      email: map.contact_email || "info@nuul.digital",
      address: map.contact_address || "Улаанбаатар",
      workingHours: map.contact_working_hours || "Даваа - Баасан, 09:00-18:00",
      facebook: map.contact_facebook || "https://facebook.com/nuul.digital",
      instagram: map.contact_instagram || "https://instagram.com/nuul.digital",
      tagline: map.site_tagline || "Монголын бизнесүүдийг дижитал ертөнцөд хүргэх иж бүрэн платформ.",
    });
  } catch {
    return NextResponse.json({});
  }
}
