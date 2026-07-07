import type { DomainOrder } from "@prisma/client";
import { db } from "@/lib/db";
import { escapeHtml, sendEmail } from "@/lib/mail";

export const DOMAIN_EXPIRY_WARNING_DAYS = [30, 14, 7] as const;

export type DomainExpiryWarningResult = {
  scanned: number;
  sent: number;
  byDays: Record<number, number>;
  errors: number;
};

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function endOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999)
  );
}

async function sendDomainExpiryWarning(
  order: Pick<
    DomainOrder,
    "id" | "orderNumber" | "domainName" | "customerEmail" | "customerName" | "domainExpiresAt"
  >,
  daysLeft: number
): Promise<void> {
  const expiresLabel =
    order.domainExpiresAt?.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) ?? "";
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://nuul.digital").replace(/\/$/, "");

  const urgency =
    daysLeft <= 7
      ? "Таны домэйн удахгүй хугацаа дуусна. Шинэчлэхгүй бол домэйн алдагдах эрсдэлтэй."
      : daysLeft <= 14
        ? "Домэйний хугацаа дуусахад 2 долоо хоног үлдлээ."
        : "Домэйний хугацаа дуусахад 1 сар үлдлээ.";

  await sendEmail({
    to: order.customerEmail,
    subject: `Домэйн хугацаа дуусах сануулга (${daysLeft} хоног) — ${order.domainName}`,
    html: `
      <h2 style="font-family:sans-serif">Домэйн хугацаа дуусах сануулга</h2>
      <p style="font-family:sans-serif">Сайн байна уу, ${escapeHtml(order.customerName)}.</p>
      <p style="font-family:sans-serif">${urgency}</p>
      <p style="font-family:sans-serif">
        <strong>${escapeHtml(order.domainName)}</strong> домэйний хугацаа
        <strong>${escapeHtml(expiresLabel)}</strong> өдөр дуусна
        (${daysLeft} хоног үлдсэн).
      </p>
      <p style="font-family:sans-serif">Захиалгын дугаар: <strong>${escapeHtml(order.orderNumber)}</strong></p>
      <p style="font-family:sans-serif">
        <a href="${siteUrl}/app?renew=${encodeURIComponent(order.id)}">Домэйн шинэчлэх</a>
        (нэвтэрсний дараа QPay-ээр төлнө).
      </p>
      <p style="font-family:sans-serif;color:#666;font-size:13px">
        Эсвэл <a href="${siteUrl}/app">Миний бүртгэл</a> → «Шинэчлэх» товчоор үргэлжлүүлнэ.
      </p>`,
  });
}

/**
 * Daily job: send 30 / 14 / 7 day domain expiry warnings for completed registrations.
 */
export async function sendDomainExpiryWarnings(
  now = new Date()
): Promise<DomainExpiryWarningResult> {
  let scanned = 0;
  let sent = 0;
  let errors = 0;
  const byDays: Record<number, number> = { 30: 0, 14: 0, 7: 0 };

  for (const daysLeft of DOMAIN_EXPIRY_WARNING_DAYS) {
    const targetDay = addDays(now, daysLeft);
    const rangeStart = startOfUtcDay(targetDay);
    const rangeEnd = endOfUtcDay(targetDay);

    const orders = await db.domainOrder.findMany({
      where: {
        status: "COMPLETED",
        domainExpiresAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        id: true,
        orderNumber: true,
        domainName: true,
        customerEmail: true,
        customerName: true,
        domainExpiresAt: true,
      },
      take: 200,
    });

    scanned += orders.length;

    for (const order of orders) {
      try {
        await sendDomainExpiryWarning(order, daysLeft);
        sent++;
        byDays[daysLeft]++;
      } catch (err) {
        console.error("[domains/expiry-warnings]", order.orderNumber, daysLeft, err);
        errors++;
      }
    }
  }

  return { scanned, sent, byDays, errors };
}