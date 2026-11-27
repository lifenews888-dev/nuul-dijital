import { prisma } from "@nuul/db-news";
import { forTenant } from "./tenant-db";

/**
 * Үйл явдлын бүртгэлийн уншилт.
 *
 * `NewsActivity` нь `User`-тэй relation-гүй: `userId` нь зүгээр String.
 * Схем ингэж бичигдсэн нь зориуд — хэрэглэгчийг устгахад бүртгэлийн мөр
 * хамт устах ёсгүй, «хэн, хэзээ, юу» гэдэг хариулт үлдэх ёстой. Үүний
 * үнэ нь: нэрийг ТУСАД НЬ уншина (admin.html-ийн `resolveNames()` ч
 * мөн адил).
 */

/** Хажуугийн багананд хэдэн мөр */
export const ACTIVITY_MAX = 40;

export type ActivityRow = {
  id: string;
  postId: string | null;
  action: string;
  note: string | null;
  createdAt: Date;
  /** Нэр олдохгүй бол `null` — мөр нь ХЭВЭЭР үлдэнэ */
  userName: string | null;
};

export async function recentActivity(
  tenantId: string,
  limit: number = ACTIVITY_MAX,
): Promise<ActivityRow[]> {
  const rows = await forTenant(tenantId).newsActivity.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, postId: true, userId: true, action: true, note: true, createdAt: true },
  });

  if (rows.length === 0) return [];

  /**
   * Нэрийг НЭГ уншилтаар: мөр тутамд нэг query бол 40 мөр нь 40 хүсэлт
   * болно. `prisma`-г шууд хэрэглэнэ — `User` нь tenant-д хамаарахгүй,
   * `forTenant` нь түүнд `tenantId` нэмэх гэж оролдохгүй ч жагсаалтад
   * байхгүй модель тул шүүлтгүй үлдэнэ; тодорхой байхын тул шууд.
   */
  const userIds = [...new Set(rows.map((r) => r.userId).filter((id): id is string => !!id))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true },
  });
  const names = new Map(users.map((u) => [u.id, u.name]));

  return rows.map((r) => ({
    id: r.id,
    postId: r.postId,
    action: r.action,
    note: r.note,
    createdAt: r.createdAt,
    userName: (r.userId && names.get(r.userId)) || null,
  }));
}
