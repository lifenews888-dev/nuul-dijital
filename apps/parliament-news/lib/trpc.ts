import { initTRPC, TRPCError } from "@trpc/server";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { prisma } from "@nuul/db-news";
import type { NewsRole } from "@nuul/db-news";
import type { Actor } from "./permissions";
import { authOptions } from "./auth";
import { getTenant } from "./tenant";
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

export async function createContext(): Promise<Ctx> {
  const tenant = await getTenant();
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

/**
 * Контекстээс `Actor` — эрхийн функц бүрийн оролт.
 *
 * `editorialProcedure` нь «редакцын гишүүн эсэх»-ийг л хэлнэ. Хэн гэдгийг
 * ЭНД нэг л газар шийднэ: мутаци бүр `ctx.session?.user?.id`-г өөрөө
 * тайлбарлавал аль нэг нь `undefined`-ийг зөвшөөрч, `own(post, actor)`
 * гэх шалгалт «хэнийх ч биш» мэдээн дээр ажиллана.
 */
export function ctxActor(ctx: Ctx): Actor {
  if (!ctx.role) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Танд редакцын эрх алга" });
  }

  const userId = ctx.session?.user?.id;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Нэвтрээгүй байна" });
  }

  return { userId, role: ctx.role };
}
