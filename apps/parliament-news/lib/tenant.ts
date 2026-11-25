import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { prisma } from "@nuul/db-news";
import type { Tenant } from "@nuul/db-news";

/**
 * Нэг сайтын тохиргоо.
 *
 * Схем нь олон tenant-д бэлэн хэвээр (хүснэгт бүрт tenantId, forTenant-ийн
 * шүүлт, composite FK), гэхдээ домэйноор tenant хайхаа больж env-д тохируулсан
 * нэг tenant-ыг уншина. Ингэснээр headers() дуудахгүй тул нийтийн хуудас
 * статикаар кэшлэгдэж, revalidateTag-аар шинэчлэгдэж чадна.
 *
 * Хоёр дахь сайт нэмэх бол зөвхөн энэ файл host-аар хайдаг болно —
 * өгөгдлийн сан аль хэдийн тэгэхэд бэлэн.
 */
export const DEFAULT_TENANT_SLUG = "parlament";

export function tenantSlug(
  env: Record<string, string | undefined> = process.env,
): string {
  const value = env.NEWS_TENANT_SLUG;
  return value && value.trim() ? value.trim().toLowerCase() : DEFAULT_TENANT_SLUG;
}

export function getTenant(): Promise<Tenant | null> {
  const slug = tenantSlug();

  return unstable_cache(
    () => prisma.tenant.findFirst({ where: { slug, active: true } }),
    ["pn-tenant", slug],
    { revalidate: 300, tags: ["pn-tenant"] },
  )();
}

/** Server component-д: tenant seed хийгдээгүй бол 404 */
export async function requireTenant(): Promise<Tenant> {
  const tenant = await getTenant();
  if (!tenant) notFound();
  return tenant;
}
