import type { Payment, ServiceOrder, ServiceType } from "@prisma/client";
import { db } from "@/lib/db";
import { resolveServicePlan } from "@/lib/services/plans";

const PAYMENT_TTL_MS = 24 * 60 * 60 * 1000;
const ORDER_SUFFIX_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type CreateServiceOrderInput = {
  serviceType: ServiceType;
  planKey: string;
  domainName?: string;
  billingMonths?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company?: string;
  paymentMethod: "QPAY" | "BANK_TRANSFER";
  journeyId?: string;
  locale?: string;
};

export type CreateServiceOrderResult = {
  order: ServiceOrder;
  payment: Payment;
};

export class ServiceOrderError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ServiceOrderError";
  }
}

const REASON_MESSAGES: Record<string, string> = {
  PLAN_UNAVAILABLE: "Сонгосон багц одоогоор боломжгүй байна",
  DB_UNAVAILABLE: "Өгөгдлийн сан холбогдоогүй байна",
};

function randomOrderSuffix(length = 4): string {
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += ORDER_SUFFIX_CHARS[Math.floor(Math.random() * ORDER_SUFFIX_CHARS.length)];
  }
  return suffix;
}

/** Format: NS-YYYYMMDD-XXXX (Nuul Service) */
export function formatServiceOrderNumber(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `NS-${y}${m}${d}-${randomOrderSuffix(4)}`;
}

export function serviceOrderErrorMessage(code: string): string {
  return REASON_MESSAGES[code] ?? "Захиалга амжилтгүй боллоо";
}

export async function createServiceOrder(
  input: CreateServiceOrderInput
): Promise<CreateServiceOrderResult> {
  if (!process.env.DATABASE_URL) {
    throw new ServiceOrderError("DB_UNAVAILABLE", REASON_MESSAGES.DB_UNAVAILABLE);
  }

  const plan = resolveServicePlan(input.serviceType, input.planKey);
  if (!plan) {
    throw new ServiceOrderError("PLAN_UNAVAILABLE", REASON_MESSAGES.PLAN_UNAVAILABLE);
  }

  const billingMonths = Math.min(Math.max(input.billingMonths ?? 1, 1), 12);
  const unitPrice = plan.priceMnt;
  const totalAmount = unitPrice * billingMonths;
  const expiresAt = new Date(Date.now() + PAYMENT_TTL_MS);
  const domainName = input.domainName?.trim().toLowerCase() || null;

  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const orderNumber = formatServiceOrderNumber();

    try {
      return await db.$transaction(async (tx) => {
        const order = await tx.serviceOrder.create({
          data: {
            orderNumber,
            serviceType: input.serviceType,
            planKey: plan.key,
            domainName,
            unitPrice,
            totalAmount,
            billingMonths,
            customerName: input.customerName.trim(),
            customerEmail: input.customerEmail.trim().toLowerCase(),
            customerPhone: input.customerPhone.trim(),
            company: input.company?.trim() || null,
            journeyId: input.journeyId || null,
            status: "PENDING_PAYMENT",
          },
        });

        const payment = await tx.payment.create({
          data: {
            serviceOrderId: order.id,
            method: input.paymentMethod,
            amount: totalAmount,
            status: "PENDING",
            expiresAt,
          },
        });

        const serviceLabel =
          input.serviceType === "HOSTING" ? "Хостинг" : "Бизнес имэйл";

        const lead = await tx.lead.create({
          data: {
            name: order.customerName,
            email: order.customerEmail,
            phone: order.customerPhone,
            company: order.company,
            services: [serviceLabel],
            details: [
              `Захиалга: ${order.orderNumber}`,
              `Багц: ${plan.key}`,
              domainName ? `Домэйн: ${domainName}` : null,
              input.journeyId ? `Journey: ${input.journeyId}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
            status: "NEW",
          },
        });

        await tx.serviceOrder.update({
          where: { id: order.id },
          data: { leadId: lead.id },
        });

        if (input.journeyId) {
          const step = input.serviceType === "HOSTING" ? "HOSTING_SELECTED" : "EMAIL_CONFIGURED";
          try {
            await tx.onboardingJourney.update({
              where: { id: input.journeyId },
              data: { currentStep: step },
            });
          } catch {
            /* journey may have been deleted */
          }
        }

        const refreshed = await tx.serviceOrder.findUniqueOrThrow({ where: { id: order.id } });
        return { order: refreshed, payment };
      });
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "P2002" && attempt < maxAttempts - 1) continue;
      throw err;
    }
  }

  throw new ServiceOrderError("ORDER_NUMBER_CONFLICT", "Захиалгын дугаар үүсгэж чадсангүй");
}