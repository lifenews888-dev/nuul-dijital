import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@nuul/db";
import type { Tenant } from "@nuul/db";
import { parseHost, pickTenantHost } from "./host";

export { parseHost, pickTenantHost };
export type { ParsedHost } from "./host";

/** middleware зөвхөн өөрөө тавина — клиентээс ирсэн ийм header-т итгэхгүй */
export const TENANT_HEADER = "x-tenant-host";

/**
 * Production-д tenant-ыг бодит Host-оос олно, x-tenant-host-ыг зөвхөн dev-д
 * зөвшөөрнө. Ингэснээр middleware хамраагүй зам ч (эсвэл matcher буруу байсан
 * ч) хуурамч header-ээр өөр tenant уншигдахгүй.
 */
const ALLOW_HOST_OVERRIDE = process.env.NODE_ENV !== "production";

function loadTenant(value: string, kind: "domain" | "subdomain"): Promise<Tenant | null> {
  return unstable_cache(
    async () =>
      prisma.tenant.findFirst({
        where:
          kind === "domain"
            ? { active: true, domains: { has: value } }
            : { active: true, slug: value },
      }),
    ["pn-tenant", kind, value],
    { revalidate: 300, tags: ["pn-tenant"] },
  )();
}

export async function getTenantByHost(host: string | null): Promise<Tenant | null> {
  const { kind, value } = parseHost(host);
  if (kind === "unknown" || !value) return null;
  return loadTenant(value, kind);
}

/** Server component-д: tenant олдохгүй бол 404 */
/**
 * Server component-д: tenant олдохгүй бол 404.
 *
 * ISR сануулга: энэ функц headers()-ийг дууддаг тул хуудас динамик болно.
 * Tenant-ыг уншихгүй, зөвхөн revalidate тавьсан хуудас нь Full Route Cache-д
 * ЗАМААР кэшлэгдэх ба Next нь Host-оор салгадаггүй, нэг tenant-ийн HTML
 * нөгөөд үйлчилж болно. 2-р шатанд кэш хэрэгтэй бол tenant-ыг замын параметр
 * болгож (middleware rewrite: /_t/<slug>/...) кэшийн түлхүүрт оруулна.
 */
export async function requireTenant(): Promise<Tenant> {
  const h = headers();
  const host = pickTenantHost({
    host: h.get("host"),
    override: h.get(TENANT_HEADER),
    allowOverride: ALLOW_HOST_OVERRIDE,
  });

  const tenant = await getTenantByHost(host);
  if (!tenant) notFound();
  return tenant;
}
