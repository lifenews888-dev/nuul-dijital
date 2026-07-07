import type { DomainOrder } from "@prisma/client";
import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { sendFulfillmentStartedEmail } from "@/lib/domains/fulfillment-emails";
import { getRegistrarProvider } from "@/lib/domains/registrar";
import type { RegistrarRegisterInput } from "@/lib/domains/registrar/types";
import { getSiteFlag } from "@/lib/settings";

const BATCH_SIZE = 10;

export type RegisterJobResult = {
  enabled: boolean;
  provider: string;
  processed: number;
  submitted: number;
  skipped: number;
  failed: number;
  reasons: string[];
};

function toRegisterInput(order: DomainOrder): RegistrarRegisterInput {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    domainName: order.domainName,
    years: order.years,
    registrant: {
      type: order.registrantType,
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      address: order.registrantAddress,
      company: order.company,
      idType: order.registrantIdType,
      idNumber: order.registrantIdNumber,
      businessRegNumber: order.businessRegNumber,
    },
  };
}

/**
 * Auto-registration cron job (Phase 6 skeleton).
 * Picks PAID + verified orders without a registrar reference and submits via the configured provider.
 */
export async function processAutoRegistration(): Promise<RegisterJobResult> {
  const empty: RegisterJobResult = {
    enabled: false,
    provider: "manual",
    processed: 0,
    submitted: 0,
    skipped: 0,
    failed: 0,
    reasons: [],
  };

  if (!process.env.DATABASE_URL) {
    return { ...empty, reasons: ["no_database"] };
  }

  const enabled = await getSiteFlag("domains_auto_register_enabled", "false");
  if (!enabled) {
    return { ...empty, reasons: ["auto_register_disabled"] };
  }

  const provider = await getRegistrarProvider();
  if (!provider.supportsAutoRegister) {
    return {
      ...empty,
      enabled: true,
      provider: provider.id,
      reasons: ["manual_provider"],
    };
  }

  const candidates = await db.domainOrder.findMany({
    where: {
      status: "PAID",
      registrantVerified: true,
      registrarOrderId: null,
    },
    orderBy: { createdAt: "asc" },
    take: BATCH_SIZE,
  });

  const result: RegisterJobResult = {
    enabled: true,
    provider: provider.id,
    processed: candidates.length,
    submitted: 0,
    skipped: 0,
    failed: 0,
    reasons: [],
  };

  for (const order of candidates) {
    try {
      const registration = await provider.register(toRegisterInput(order));

      if (!registration.ok) {
        if (registration.retryable) {
          result.skipped++;
        } else {
          result.failed++;
        }
        result.reasons.push(`${order.orderNumber}:${registration.code}`);
        continue;
      }

      const expiresAt =
        registration.expiresAt ??
        (() => {
          const d = new Date();
          d.setFullYear(d.getFullYear() + order.years);
          return d;
        })();

      await db.domainOrder.update({
        where: { id: order.id },
        data: {
          status: "FULFILLING",
          registrarName: registration.registrarName,
          registrarOrderId: registration.registrarOrderId,
          domainExpiresAt: expiresAt,
        },
      });

      await sendFulfillmentStartedEmail({
        orderNumber: order.orderNumber,
        domainName: order.domainName,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        totalAmount: order.totalAmount,
        years: order.years,
        registrarName: registration.registrarName,
        domainExpiresAt: registration.expiresAt ? expiresAt : null,
      });

      await logActivity({
        action: "UPDATE",
        entity: "DomainOrder",
        entityId: order.id,
        summary: `Авто бүртгэл илгээгдлээ: ${order.orderNumber}`,
        metadata: {
          domain: order.domainName,
          registrar: registration.registrarName,
          registrarOrderId: registration.registrarOrderId,
          provider: provider.id,
        },
      });

      result.submitted++;
    } catch (err) {
      result.failed++;
      const msg = err instanceof Error ? err.message : "unknown_error";
      result.reasons.push(`${order.orderNumber}:exception:${msg}`);
      console.error("[jobs/register]", order.id, err);
    }
  }

  return result;
}