import type { Organization, User } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeLookupEmail } from "@/lib/domains/order-lookup";

function slugBaseFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "org";
  return local
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32) || "org";
}

async function uniqueOrgSlug(email: string): Promise<string> {
  const base = slugBaseFromEmail(email);
  let slug = base;
  let n = 0;
  while (await db.organization.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

/** Upsert a customer User record (magic-link accounts have no password). */
export async function ensureCustomerUser(email: string): Promise<User> {
  const normalized = normalizeLookupEmail(email);
  const existing = await db.user.findUnique({ where: { email: normalized } });
  if (existing) {
    if (!existing.active) {
      return db.user.update({
        where: { id: existing.id },
        data: { active: true },
      });
    }
    return existing;
  }

  const localPart = normalized.split("@")[0] ?? "Customer";
  return db.user.create({
    data: {
      email: normalized,
      name: localPart,
      role: "USER",
      active: true,
    },
  });
}

/** Returns the user's primary owned organization, creating one if needed. */
export async function ensurePersonalOrganization(user: User): Promise<Organization> {
  const membership = await db.orgMember.findFirst({
    where: { userId: user.id, role: "OWNER" },
    include: { org: true },
  });
  if (membership) return membership.org;

  const slug = await uniqueOrgSlug(user.email);
  return db.organization.create({
    data: {
      slug,
      name: user.name?.trim() || slug,
      billingEmail: user.email,
      type: "INDIVIDUAL",
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });
}

/** Attach historical guest orders to the org on first customer login. */
export async function linkOrdersToOrganization(
  orgId: string,
  userId: string,
  email: string
): Promise<{ domains: number; services: number }> {
  const normalized = normalizeLookupEmail(email);
  const filter = { equals: normalized, mode: "insensitive" as const };

  const [domains, services] = await Promise.all([
    db.domainOrder.updateMany({
      where: { customerEmail: filter, orgId: null },
      data: { orgId, userId },
    }),
    db.serviceOrder.updateMany({
      where: { customerEmail: filter, orgId: null },
      data: { orgId, userId },
    }),
  ]);

  return { domains: domains.count, services: services.count };
}

/** Full customer bootstrap after magic-link verification. */
export async function bootstrapCustomerAccount(email: string) {
  const user = await ensureCustomerUser(email);
  const org = await ensurePersonalOrganization(user);
  const linked = await linkOrdersToOrganization(org.id, user.id, email);
  return { user, org, linked };
}