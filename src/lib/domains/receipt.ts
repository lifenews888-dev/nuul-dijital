import type { DomainOrder, Payment } from "@prisma/client";
import { formatDomainPrice } from "@/lib/domains/format";
import type { BankSettings } from "@/lib/domains/bank-settings";
import { escapeHtml, row } from "@/lib/mail";

type OrderReceipt = Pick<
  DomainOrder,
  "orderNumber" | "domainName" | "customerName" | "customerEmail" | "totalAmount" | "years"
>;

type PaymentReceipt = Pick<Payment, "method" | "amount" | "paidAt" | "transactionId">;

export function buildPaymentReceiptHtml(order: OrderReceipt, payment: PaymentReceipt): string {
  const priceLabel = formatDomainPrice(payment.amount, "mn");
  const paidAt = payment.paidAt?.toLocaleString("mn-MN") ?? "—";

  return `
    <h2 style="font-family:sans-serif">Төлбөрийн баримт</h2>
    <table style="font-family:sans-serif;border-collapse:collapse">
      ${row("Захиалгын дугаар", order.orderNumber)}
      ${row("Домэйн", order.domainName)}
      ${row("Хугацаа", `${order.years} жил`)}
      ${row("Дүн", priceLabel)}
      ${row("Төлбөрийн арга", payment.method)}
      ${row("Төлсөн огноо", paidAt)}
      ${row("Гүйлгээ", payment.transactionId ?? undefined)}
      ${row("Нэр", order.customerName)}
      ${row("Имэйл", order.customerEmail)}
    </table>`;
}

export function buildBankTransferInstructionsHtml(
  order: OrderReceipt,
  bank: BankSettings
): string {
  const priceLabel = formatDomainPrice(order.totalAmount, "mn");

  return `
    <h2 style="font-family:sans-serif">Банкны шилжүүлгийн заавар</h2>
    <p style="font-family:sans-serif">Дараах данс руу <strong>${escapeHtml(priceLabel)}</strong> шилжүүлнэ үү.</p>
    <table style="font-family:sans-serif;border-collapse:collapse">
      ${row("Банк", bank.bankName)}
      ${row("Дансны дугаар", bank.bankAccountNumber)}
      ${row("Дансны эзэмшигч", bank.bankAccountName)}
      ${row("IBAN", bank.bankIban)}
      ${row("Гүйлгээний утга", order.orderNumber)}
      ${row("Дүн", priceLabel)}
      ${row("Домэйн", order.domainName)}
    </table>
    <p style="font-family:sans-serif">Төлбөр баталгаажмагц бид танд имэйлээр мэдэгдэнэ. 24 цагийн дотор төлнө үү.</p>`;
}

export function buildOrderExpiredEmailHtml(order: OrderReceipt): string {
  const priceLabel = formatDomainPrice(order.totalAmount, "mn");

  return `
    <h2 style="font-family:sans-serif">Төлбөрийн хугацаа дууссан</h2>
    <p style="font-family:sans-serif"><strong>${escapeHtml(order.domainName)}</strong> домэйний захиалгын төлбөрийн хугацаа дууслаа.</p>
    <table style="font-family:sans-serif;border-collapse:collapse">
      ${row("Захиалгын дугаар", order.orderNumber)}
      ${row("Дүн", priceLabel)}
    </table>
    <p style="font-family:sans-serif">Дахин захиалах бол <a href="https://nuul.digital/domains">nuul.digital/domains</a> хуудас руу орно уу.</p>`;
}