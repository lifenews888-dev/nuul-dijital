import { prisma } from "@nuul/db-news";

/**
 * tenantId баганатай моделиуд. Query бүрт автоматаар шүүгдэнэ.
 * BillStage нь Bill-ээр дамжин хамгаалагдана (өөрөө tenantId-гүй).
 */
// Шинэ pn_ модель схемд нэмэх бол ЭНД БАС нэмнэ: жагсаалтад байхгүй модель
// шүүлтгүй (fail-open) үлдэнэ.
export const TENANT_MODELS = [
  "TenantMember",
  "NewsPost",
  "NewsMedia",
  "NewsCategory",
  "NewsSlugRedirect",
  "NewsComment",
  "NewsActivity",
  "TenantSetting",
  "Bill",
  "BillStage",
  "Agenda",
  "LiveState",
  "Banner",
  "TickerAd",
  "AdRate",
  "FxRate",
  "SocialPost",
] as const;

const SCOPED = new Set<string>(TENANT_MODELS);

/** where-т tenantId нэмэх үйлдлүүд */
const WHERE_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "updateMany",
  "deleteMany",
]);

/**
 * Хориотой: Prisma эдгээрийн where-д unique биш tenantId-г зөвшөөрөхгүй тул
 * шүүлт нэмэх боломжгүй — id-гаар өөр tenant-ийн мөрт хүрэх эрсдэлтэй.
 */
const BLOCKED_OPS = new Set(["findUnique", "findUniqueOrThrow", "update", "delete"]);

type AnyArgs = { where?: Record<string, unknown>; data?: unknown };

/** where-т tenantId нэмэх (хамаарахгүй модельд хэвээр нь буцаана) */
export function scopeWhere(
  model: string,
  where: Record<string, unknown> | undefined,
  tenantId: string,
): Record<string, unknown> {
  if (!SCOPED.has(model)) return where ?? {};
  return { ...(where ?? {}), tenantId };
}

function withTenant(data: unknown, tenantId: string, model: string): unknown {
  const row = (data ?? {}) as Record<string, unknown>;
  const given = row.tenantId;

  if (typeof given === "string" && given !== tenantId) {
    throw new Error(
      model + ": tenantId зөрчил — " + given + " гэсэн өөр tenant-д бичих гэж байна",
    );
  }

  return { ...row, tenantId };
}

/**
 * Нэг tenant-д хаалттай Prisma client. Контентын query бүр үүгээр явна.
 */
export function forTenant(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!model || !SCOPED.has(model)) {
            return query(args);
          }

          if (BLOCKED_OPS.has(operation)) {
            throw new Error(
              model +
                "." +
                operation +
                ": tenant модельд хориотой — findFirst, updateMany, deleteMany хэрэглэ",
            );
          }

          if (operation === "upsert") {
            throw new Error(
              model + ".upsert: tenant модельд хэрэглэхгүй — findFirst + create/update",
            );
          }

          const next = ((args ?? {}) as AnyArgs);

          if (operation === "create") {
            next.data = withTenant(next.data, tenantId, model);
            return query(next);
          }

          if (operation === "createMany" || operation === "createManyAndReturn") {
            const rows = next.data;
            next.data = Array.isArray(rows)
              ? rows.map((r) => withTenant(r, tenantId, model))
              : withTenant(rows, tenantId, model);
            return query(next);
          }

          if (WHERE_OPS.has(operation)) {
            next.where = scopeWhere(model, next.where, tenantId);
            return query(next);
          }

          return query(next);
        },
      },
    },
  });
}

export type TenantClient = ReturnType<typeof forTenant>;

/**
 * create-ийн data-д tenantId-г forTenant extension автоматаар тавина, гэхдээ
 * Prisma-ийн төрөл үүнийг мэдэхгүй тул шаардсан хэвээр байна. Энэ нь
 * гүйцэтгэлд юу ч хийхгүй — зөвхөн тэр цоорхойг нөхөж, яагаад гэдгийг нэрлэнэ.
 */
export function tenantData<T>(data: T): T & { tenantId: string } {
  return data as T & { tenantId: string };
}
