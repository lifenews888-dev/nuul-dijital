import { Prisma } from "@prisma/client";
import type { DomainOrder, Payment } from "@prisma/client";
import { db } from "@/lib/db";
import { verifyDomainForOrder } from "@/lib/domains/rdap";
import { parseFqdn } from "@/lib/domains/sanitize";

const PAYMENT_TTL_MS = 24 * 60 * 60 * 1000;
const ORDER_SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type CreateOrderInput = {
  domain: string;
  years: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company?: string;
  registrantType: "INDIVIDUAL" | "BUSINESS";
  registrantAddress: string;
  registrantIdType?: string;
  registrantIdNumber?: string;
  businessRegNumber?: string;
  paymentMethod: "QPAY" | "BANK_TRANSFER";
  journeyId?: string;
  locale?: string;
  orgId?: string;
  userId?: string;
};

export type CreateOrderResult = {
  order: DomainOrder;
  payment: Payment;
};

export class DomainOrderError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "DomainOrderError";
  }
}

export class DomainConflictError extends DomainOrderError {
  constructor() {
    super("DOMAIN_RESERVED", "Энэ домэйнийг өөр хэрэглэгч захиалж байна.");
  }
}

const REASON_MESSAGES: Record<string, string> = {
  INVALID_DOMAIN: "Домэйн нэр буруу байна",
  DOMAIN_TAKEN: "Энэ домэйн аль хэдийн бүртгэгдсэн байна",
  DOMAIN_UNKNOWN: "Домэйний боломжийг баталгаажуулж чадсангүй. Дахин хайна уу",
  DOMAIN_RESERVED: "Энэ домэйнийг өөр хэрэглэгч захиалж байна",
  TLD_UNAVAILABLE: "Энэ TLD одоогоор идэвхгүй байна",
};

function randomOrderSuffix(length = 4): string {
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += ORDER_SUFFIX_CHARS[Math.floor(Math.random() * ORDER_SUFFIX_CHARS.length)];
  }
  return suffix;
}

/** Format: ND-YYYYMMDD-XXXX */
export function formatOrderNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `ND-${y}${m}${d}-${randomOrderSuffix(4)}`;
}

export function domainOrderErrorMessage(code: string): string {
  return REASON_MESSAGES[code] ?? "Захиалга амжилтгүй боллоо";
}

/**
 * Synchronous order + payment + lead creation. Throws on failure — never uses persist().
 */
export async function createDomainOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  if (!process.env.DATABASE_URL) {
    throw new DomainOrderError("DB_UNAVAILABLE", "Өгөгдлийн сан холбогдоогүй байна");
  }

  const parsed = parseFqdn(input.domain);
  if (!parsed) {
    throw new DomainOrderError("INVALID_DOMAIN", REASON_MESSAGES.INVALID_DOMAIN);
  }

  const verify = await verifyDomainForOrder(input.domain);
  if (!verify.ok) {
    const code = verify.reason ?? "DOMAIN_UNAVAILABLE";
    throw new DomainOrderError(code, domainOrderErrorMessage(code));
  }

  const domainName = `${parsed.label}${parsed.tld}`;

  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const orderNumber = formatOrderNumber();

    try {
      return await db.$transaction(async (tx) => {
        const tldProduct = await tx.tldProduct.findFirst({
          where: { tld: parsed.tld, status: "ACTIVE" },
        });
        if (!tldProduct) {
          throw new DomainOrderError("TLD_UNAVAILABLE", REASON_MESSAGES.TLD_UNAVAILABLE);
        }

        const years = Math.min(
          Math.max(input.years, tldProduct.minYears),
          tldProduct.maxYears
        );
        const unitPrice = tldProduct.registerPrice;
        const totalAmount = unitPrice * years;
        const expiresAt = new Date(Date.now() + PAYMENT_TTL_MS);

        const order = await tx.domainOrder.create({
          data: {
            orderNumber,
            domainName,
            domainLabel: parsed.label,
            tldProductId: tldProduct.id,
            years,
            unitPrice,
            totalAmount,
            status: "PENDING_PAYMENT",
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            customerPhone: input.customerPhone,
            company: input.company?.trim() || null,
            registrantType: input.registrantType,
            registrantAddress: input.registrantAddress,
            registrantIdType: input.registrantIdType?.trim() || null,
            registrantIdNumber: input.registrantIdNumber?.trim() || null,
            businessRegNumber: input.businessRegNumber?.trim() || null,
            journeyId: input.journeyId ?? null,
            orgId: input.orgId ?? null,
            userId: input.userId ?? null,
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

        const lead = await tx.lead.create({
          data: {
            name: input.customerName,
            email: input.customerEmail,
            phone: input.customerPhone,
            company: input.company?.trim() || null,
            services: ["Домэйн"],
            details: `Домэйн захиалга: ${domainName}`,
            status: "NEW",
          },
        });

        await tx.domainOrder.update({
          where: { id: order.id },
          data: { leadId: lead.id },
        });

        if (input.journeyId) {
          try {
            await tx.onboardingJourney.update({
              where: { id: input.journeyId },
              data: {
                selectedDomain: domainName,
                email: input.customerEmail,
                phone: input.customerPhone,
                businessName: input.company?.trim() || undefined,
              },
            });
          } catch {
            /* journey may have been deleted */
          }
        }

        return { order, payment };
      });
    } catch (err) {
      if (err instanceof DomainOrderError) throw err;

      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const target = (err.meta?.target as string[] | undefined) ?? [];
        if (target.includes("domainName")) {
          throw new DomainConflictError();
        }
        if (target.includes("orderNumber") && attempt < maxAttempts - 1) {
          continue;
        }
        throw new DomainConflictError();
      }

      throw err;
    }
  }

  throw new DomainOrderError("ORDER_NUMBER_COLLISION", "Захиалгын дугаар үүсгэж чадсангүй. Дахин оролдоно уу");
}