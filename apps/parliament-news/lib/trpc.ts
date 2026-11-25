import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { prisma } from "@nuul/db";
import type { NewsRole } from "@nuul/db";
import { authOptions } from "./auth";
import { getTenantByHost, TENANT_HEADER } from "./tenant";
import { pickTenantHost } from "./host";
import { forTenant } from "./tenant-db";
import type { TenantClient } from "./tenant-db";

export type Ctx = {
  db: TenantClient | null;
  tenantId: string | null;
  session: Session | null;
  role: NewsRole | null;
};

/**
 * TenantMember бичлэггүй хэрэглэгч эрхгүй — null. nuul.mn-д нэвтэрсэн нь
 * мэдээний эрх өгөхгүй (artifact-ийн "canEdit ? reporter" логикийг авахгүй).
 */
export async function getNewsRole(
  tenantId: string,
  userId: string | undefined,
): Promise<NewsRole | null> {
  if (!userId) return null;

  const member = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
    select: { role: true, active: true },
  });

  return member && member.active ? member.role : null;
}

export async function createContext(req: Request): Promise<Ctx> {
  // Бодит Host-оос: клиентийн x-tenant-host-д production-д итгэхгүй
  const host = pickTenantHost({
    host: req.headers.get("host"),
    override: req.headers.get(TENANT_HEADER),
    allowOverride: process.env.NODE_ENV !== "production",
  });

  const tenant = await getTenantByHost(host);
  const session = await getServerSession(authOptions);

  const role =
    tenant && session?.user?.id ? await getNewsRole(tenant.id, session.user.id) : null;

  return {
    db: tenant ? forTenant(tenant.id) : null,
    tenantId: tenant ? tenant.id : null,
    session,
    role,
  };
}

const t = initTRPC.context<Ctx>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

/** Домэйноор tenant танигдсан байхыг шаардана */
export const tenantProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.tenantId || !ctx.db) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Tenant олдсонгүй" });
  }
  return next({ ctx: { ...ctx, tenantId: ctx.tenantId, db: ctx.db } });
});

/** Редакцын гишүүн байхыг шаардана */
export const editorialProcedure = tenantProcedure.use(({ ctx, next }) => {
  if (!ctx.role) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Танд редакцын эрх алга" });
  }
  return next({ ctx: { ...ctx, role: ctx.role } });
});

export function requireRole(role: NewsRole | null, allowed: NewsRole[]): void {
  if (!role || !allowed.includes(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Энэ үйлдлийн эрх алга" });
  }
}
