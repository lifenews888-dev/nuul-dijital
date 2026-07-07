import { Prisma } from "@prisma/client";
import type { DomainOrder, Payment } from "@prisma/client";

type RenewalSourceOrder = Prisma.DomainOrderGetPayload<{
  include: { tldProduct: true };
}>;
import { db } from "@/lib/db";


const PAYMENT_TTL_MS = 24 * 60 * 60 * 1000;
const RENEWAL_SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/** Allow renewal up to 30 days after expiry. */
export const RENEWAL_GRACE_DAYS_AFTER_EXPIRY = 30;
/** Show renew CTA within 60 days of expiry. */
export const RENEWAL_WINDOW_DAYS = 60;

function randomSuffix(length = 4): string {
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += RENEWAL_SUFFIX_CHARS[Math.floor(Math.random() * RENEWAL_SUFFIX_CHARS.length)];
  }
  return suffix;
}

/** Format: NR-YYYYMMDD-XXXX */
export function formatRenewalOrderNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `NR-${y}${m}${d}-${randomSuffix(4)}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export class DomainRenewalError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "DomainRenewalError";
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  SOURCE_NOT_FOUND: "Домэйн захиалга олдсонгүй",
  SOURCE_NOT_RENEWABLE: "Энэ домэйнийг шинэчлэх боломжгүй",
  FORBIDDEN: "Энэ домэйнийг шинэчлэх эрхгүй",
  PENDING_RENEWAL: "Энэ домэйнд идэвхтэй шинэчлэлтийн захиалга байна",
  TLD_UNAVAILABLE: "Энэ TLD одоогоор идэвхгүй байна",
  DB_UNAVAILABLE: "Өгөгдлийн сан холбогдоогүй байна",
};

export function domainRenewalErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? "Шинэчлэлтийн захиалга амжилтгүй боллоо";
}

export function isDomainRenewable(
  order: Pick<DomainOrder, "status" | "domainExpiresAt">,
  now = new Date()
): boolean {
  if (order.status !== "COMPLETED" || !order.domainExpiresAt) return false;
  const graceEnd = addDays(order.domainExpiresAt, RENEWAL_GRACE_DAYS_AFTER_EXPIRY);
  if (now > graceEnd) return false;
  const windowStart = addDays(order.domainExpiresAt, -RENEWAL_WINDOW_DAYS);
  return now >= windowStart;
}

export type CreateDomainRenewalInput = {
  sourceOrderId: string;
  years: number;
  paymentMethod: "QPAY" | "BANK_TRANSFER";
  orgId: string;
  userId: string;
  customerEmail: string;
};

export type CreateDomainRenewalResult = {
  order: DomainOrder;
  payment: Payment;
  sourceOrder: RenewalSourceOrder;
  renewPriceMnt: number;
};

export async function getRenewalContext(
  sourceOrderId: string,
  orgId: string
): Promise<{
  source: RenewalSourceOrder;
  renewPriceMnt: number;
  pendingRenewalOrderId: string | null;
  renewable: boolean;
}> {
  const source = await db.domainOrder.findFirst({
    where: { id: sourceOrderId, orgId },
    include: { tldProduct: true },
  });

  if (!source) {
    throw new DomainRenewalError("SOURCE_NOT_FOUND", ERROR_MESSAGES.SOURCE_NOT_FOUND);
  }

  const renewable = isDomainRenewable(source);
  const renewPriceMnt =
    source.tldProduct.status === "ACTIVE" ? source.tldProduct.renewPrice : 0;

  const pending = await db.domainOrder.findFirst({
    where: {
      renewalSourceOrderId: source.id,
      status: "PENDING_PAYMENT",
    },
    select: { id: true },
  });

  return {
    source,
    renewPriceMnt,
    pendingRenewalOrderId: pending?.id ?? null,
    renewable: renewable && renewPriceMnt > 0 && !pending,
  };
}

export async function createDomainRenewalOrder(
  input: CreateDomainRenewalInput
): Promise<CreateDomainRenewalResult> {
  if (!process.env.DATABASE_URL) {
    throw new DomainRenewalError("DB_UNAVAILABLE", ERROR_MESSAGES.DB_UNAVAILABLE);
  }

  const { source, renewPriceMnt, pendingRenewalOrderId, renewable } =
    await getRenewalContext(input.sourceOrderId, input.orgId);

  if (source.orgId !== input.orgId) {
    throw new DomainRenewalError("FORBIDDEN", ERROR_MESSAGES.FORBIDDEN);
  }

  if (!renewable) {
    throw new DomainRenewalError("SOURCE_NOT_RENEWABLE", ERROR_MESSAGES.SOURCE_NOT_RENEWABLE);
  }

  if (pendingRenewalOrderId) {
    throw new DomainRenewalError("PENDING_RENEWAL", ERROR_MESSAGES.PENDING_RENEWAL);
  }

  const tldProduct = source.tldProduct;
  if (tldProduct.status !== "ACTIVE") {
    throw new DomainRenewalError("TLD_UNAVAILABLE", ERROR_MESSAGES.TLD_UNAVAILABLE);
  }

  const years = Math.min(Math.max(input.years, tldProduct.minYears), tldProduct.maxYears);
  const unitPrice = tldProduct.renewPrice;
  const totalAmount = unitPrice * years;
  const expiresAt = new Date(Date.now() + PAYMENT_TTL_MS);

  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const orderNumber = formatRenewalOrderNumber();

    try {
      return await db.$transaction(async (tx) => {
        const order = await tx.domainOrder.create({
          data: {
            orderNumber,
            domainName: source.domainName,
            domainLabel: source.domainLabel,
            tldProductId: source.tldProductId,
            years,
            unitPrice,
            totalAmount,
            status: "PENDING_PAYMENT",
            customerName: source.customerName,
            customerEmail: input.customerEmail,
            customerPhone: source.customerPhone,
            company: source.company,
            registrantType: source.registrantType,
            registrantAddress: source.registrantAddress,
            registrantIdType: source.registrantIdType,
            registrantIdNumber: source.registrantIdNumber,
            businessRegNumber: source.businessRegNumber,
            registrantVerified: true,
            orgId: input.orgId,
            userId: input.userId,
            renewalSourceOrderId: source.id,
            registrarName: source.registrarName,
            registrarOrderId: source.registrarOrderId,
          },
        });

        const payment = await tx.payment.create({
          data: {
            domainOrderId: order.id,
            method: input.paymentMethod,
            amount: totalAmount,
            status: "PENDING",
            expiresAt,
          },
        });

        return { order, payment, sourceOrder: source, renewPriceMnt: unitPrice };
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = (err.meta?.target as string[] | undefined) ?? [];
        if (target.includes("orderNumber") && attempt < maxAttempts - 1) continue;
      }
      throw err;
    }
  }

  throw new DomainRenewalError("ORDER_NUMBER_COLLISION", "Захиалгын дугаар үүсгэж чадсангүй");
}

export function computeRenewedExpiry(
  currentExpiresAt: Date | null,
  years: number,
  paidAt = new Date()
): Date {
  const base =
    currentExpiresAt && currentExpiresAt.getTime() > paidAt.getTime()
      ? currentExpiresAt
      : paidAt;
  const result = new Date(base);
  result.setFullYear(result.getFullYear() + years);
  return result;
}