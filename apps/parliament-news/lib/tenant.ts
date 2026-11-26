import { notFound } from "next/navigation";
import { prisma } from "@nuul/db-news";
import type { Tenant } from "@nuul/db-news";

/**
 * Нэг сайтын тохиргоо.
 *
 * Схем нь олон tenant-д бэлэн хэвээр (хүснэгт бүрт tenantId, forTenant-ийн
 * шүүлт, composite FK), гэхдээ домэйноор tenant хайхаа больж env-д тохируулсан
 * нэг tenant-ыг уншина. Ингэснээр headers() дуудахгүй тул нийтийн хуудас
 * статикаар кэшлэгдэж чадна.
 *
 * Хоёр дахь сайт нэмэх бол зөвхөн энэ файл host-аар хайдаг болно —
 * өгөгдлийн сан аль хэдийн тэгэхэд бэлэн.
 *
 * КЭШГҮЙ, зориуд. Өмнө нь `unstable_cache`-тай байсан ч тэр нь Next-ийн
 * рендерийн контекст (incrementalCache) шаарддаг: рендерээс ГАДНА дуудахад
 * "Invariant: incrementalCache missing" гэж унана — тест, seed, cron, ямар ч
 * скриптээс tenant уншиж болохгүй болно. React-ийн `cache()` нь зөвхөн RSC
 * нөхцөлд экспортлогддог тул мөн адил тус болохгүй.
 *
 * Орлуулга нь хуудас бүрийн `revalidate = 300`: индекстэй нэг мөрийн уншилт
 * 5 минутад нэг удаа болно, дахин кэшлэх нь хэмжигдэхүйц ашиг өгөхгүй. Рендер
 * доторх давхардлыг арилгах шаардлага хэмжилтээр гарвал тэр үед `server-only`
 * модульд React-ийн `cache()`-ийг нэмнэ.
 */
export const DEFAULT_TENANT_SLUG = "parlament";

export function tenantSlug(
  env: Record<string, string | undefined> = process.env,
): string {
  const value = env.NEWS_TENANT_SLUG;
  return value && value.trim() ? value.trim().toLowerCase() : DEFAULT_TENANT_SLUG;
}

export function getTenant(): Promise<Tenant | null> {
  return prisma.tenant.findFirst({ where: { slug: tenantSlug(), active: true } });
}

/** Server component-д: tenant seed хийгдээгүй бол 404 */
export async function requireTenant(): Promise<Tenant> {
  const tenant = await getTenant();
  if (!tenant) notFound();
  return tenant;
}
