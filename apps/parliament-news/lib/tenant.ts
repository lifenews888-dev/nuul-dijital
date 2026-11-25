import { unstable_cache } from "next/cache";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@nuul/db";
import type { Tenant } from "@nuul/db";
import { parseHost } from "./host";

export { parseHost };
export type { ParsedHost } from "./host";

/** middleware зөвхөн өөрөө тавина — клиентээс ирсэн ийм header-т итгэхгүй */
export const TENANT_HEADER = "x-tenant-host";

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
export async function requireTenant(): Promise<Tenant> {
  const tenant = await getTenantByHost(headers().get(TENANT_HEADER));
  if (!tenant) notFound();
  return tenant;
}
