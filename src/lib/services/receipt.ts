import type { ServiceOrder } from "@prisma/client";
import { formatDomainPrice } from "@/lib/domains/format";
import type { BankSettings } from "@/lib/domains/bank-settings";
import { escapeHtml, row } from "@/lib/mail";
import { SERVICE_TYPE_LABELS } from "@/lib/services/order-status";

type ServiceOrderReceipt = Pick<
  ServiceOrder,
  | "orderNumber"
  | "serviceType"
  | "planKey"
  | "domainName"
  | "customerName"
  | "customerEmail"
  | "totalAmount"
  | "billingMonths"
>;

export function buildServiceBankTransferHtml(
  order: ServiceOrderReceipt,
  bank: BankSettings
): string {
  const serviceLabel = SERVICE_TYPE_LABELS[order.serviceType];
  const priceLabel = formatDomainPrice(order.totalAmount, "mn");

  return `
    <h2 style="font-family:sans-serif">Банкны шилжүүлгийн заавар</h2>
    <p style="font-family:sans-serif">${escapeHtml(serviceLabel)} — <strong>${escapeHtml(order.planKey)}</strong> багцын төлбөр <strong>${escapeHtml(priceLabel)}</strong>.</p>
    <table style="font-family:sans-serif;border-collapse:collapse">
      ${row("Банк", bank.bankName)}
      ${row("Дансны дугаар", bank.bankAccountNumber)}
      ${row("Дансны эзэмшигч", bank.bankAccountName)}
      ${row("IBAN", bank.bankIban)}
      ${row("Гүйлгээний утга", order.orderNumber)}
      ${row("Дүн", priceLabel)}
      ${row("Үйлчилгээ", `${serviceLabel} / ${order.planKey}`)}
      ${row("Домэйн", order.domainName ?? undefined)}
    </table>
    <p style="font-family:sans-serif">Төлбөр баталгаажмагц бид танд имэйлээр мэдэгдэнэ. 24 цагийн дотор төлнө үү.</p>`;
}