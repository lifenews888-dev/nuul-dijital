import type { DomainOrder } from "@prisma/client";
import { escapeHtml, row, sendEmail } from "@/lib/mail";
import { formatDomainPrice } from "@/lib/domains/format";

type OrderEmail = Pick<
  DomainOrder,
  | "orderNumber"
  | "domainName"
  | "customerName"
  | "customerEmail"
  | "totalAmount"
  | "years"
  | "registrarName"
  | "domainExpiresAt"
>;

export async function sendFulfillmentStartedEmail(order: OrderEmail) {
  const priceLabel = formatDomainPrice(order.totalAmount, "mn");

  await sendEmail({
    subject: `Домэйн бүртгэл эхэллээ — ${order.orderNumber}`,
    replyTo: order.customerEmail,
    html: `
      <h2 style="font-family:sans-serif">Бүртгэл эхэллээ</h2>
      <table style="font-family:sans-serif;border-collapse:collapse">
        ${row("Захиалгын дугаар", order.orderNumber)}
        ${row("Домэйн", order.domainName)}
        ${row("Дүн", priceLabel)}
        ${row("Нэр", order.customerName)}
      </table>
      <p style="font-family:sans-serif">Бид ${escapeHtml(order.domainName)} домэйнийг registrar дээр бүртгэж байна. 24 цагийн дотор мэдэгдэх болно.</p>`,
  });

  await sendEmail({
    to: order.customerEmail,
    subject: `Бүртгэл эхэллээ — ${order.domainName}`,
    html: `
      <h2 style="font-family:sans-serif">Таны домэйн бүртгэгдэж байна</h2>
      <p style="font-family:sans-serif"><strong>${escapeHtml(order.domainName)}</strong> домэйний төлбөр баталгаажсан. Бид registrar дээр бүртгэлийг гүйцэтгэж байна.</p>
      <p style="font-family:sans-serif">Захиалгын дугаар: <strong>${escapeHtml(order.orderNumber)}</strong></p>
      <p style="font-family:sans-serif">Асуулт байвал hello@nuul.digital хаяг руу бичнэ үү.</p>`,
  });
}

export async function sendDomainCompletedEmail(order: OrderEmail) {
  const expires =
    order.domainExpiresAt?.toLocaleDateString("mn-MN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }) ?? null;

  await sendEmail({
    subject: `Домэйн бүртгэл дууссан — ${order.orderNumber}`,
    replyTo: order.customerEmail,
    html: `
      <h2 style="font-family:sans-serif">Домэйн идэвхжлээ</h2>
      <table style="font-family:sans-serif;border-collapse:collapse">
        ${row("Захиалгын дугаар", order.orderNumber)}
        ${row("Домэйн", order.domainName)}
        ${row("Хугацаа", `${order.years} жил`)}
        ${row("Registrar", order.registrarName ?? undefined)}
        ${row("Дуусах огноо", expires ?? undefined)}
        ${row("Нэр", order.customerName)}
        ${row("Имэйл", order.customerEmail)}
      </table>`,
  });

  await sendEmail({
    to: order.customerEmail,
    subject: `Домэйн бэлэн боллоо — ${order.domainName}`,
    html: `
      <h2 style="font-family:sans-serif">Баяр хүргэе!</h2>
      <p style="font-family:sans-serif"><strong>${escapeHtml(order.domainName)}</strong> домэйн амжилттай бүртгэгдлээ.</p>
      <p style="font-family:sans-serif">Захиалгын дугаар: <strong>${escapeHtml(order.orderNumber)}</strong></p>
      ${expires ? `<p style="font-family:sans-serif">Дуусах огноо: <strong>${escapeHtml(expires)}</strong></p>` : ""}
      <p style="font-family:sans-serif">Дараагийн алхам: хостинг, бизнес имэйл, вэбсайт — <a href="https://nuul.digital/quote">Үнийн санал авах</a></p>`,
  });
}