import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { getTenant } from "./tenant";
import { getNewsRole } from "./trpc";
import type { Actor } from "./permissions";

/**
 * Студийн сесс — нэвтэрсэн хэрэглэгчээс РЕДАКЦЫН ҮҮРЭГ рүү.
 *
 * `middleware.ts` нь зөвхөн «токен байна уу» гэдгийг Edge дээр шалгана.
 * Тэр нь хангалтгүй: nuul.mn-ийн санд хэрэглэгч байж болох ч парламентын
 * редакцын гишүүн биш байж болно. Иймд студийн хуудас, layout бүр ҮҮНИЙГ
 * дуудаж, өгөгдлийг ҮҮРГЭЭР нь л үзүүлнэ.
 *
 * Гурван хаалга: сесс → tenant → `TenantMember` (идэвхтэй). Аль нэг нь
 * хоосон бол сесс БАЙХГҮЙ — хагас эрх гэж байхгүй.
 */
export type StudioSession = {
  actor: Actor;
  tenantId: string;
  name: string | null;
  email: string;
};

/**
 * Гишүүний мөрөөс `Actor` үүсгэнэ. Гишүүн биш, эсвэл идэвхгүй болгосон бол
 * `null` — Actor байхгүй гэдэг нь «юу ч хийж чадахгүй» гэсэн үг, учир нь
 * `lib/permissions.ts`-ийн функц бүр Actor шаардана.
 */
export async function memberActor(
  tenantId: string,
  userId: string | undefined,
): Promise<Actor | null> {
  const role = await getNewsRole(tenantId, userId);
  return role && userId ? { userId, role } : null;
}

/** Эрхгүй бол `null` — дуудагч нь redirect эсвэл 403-ыг шийднэ */
export async function studioSession(): Promise<StudioSession | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;

  const tenant = await getTenant();
  if (!tenant) return null;

  const actor = await memberActor(tenant.id, userId);
  if (!actor) return null;

  return {
    actor,
    tenantId: tenant.id,
    name: session.user.name ?? null,
    email: session.user.email ?? "",
  };
}

/** Эрхгүй бол нэвтрэх хуудас руу шиднэ — хуудас хэзээ ч хагас зурагдахгүй */
export async function requireStudio(): Promise<StudioSession> {
  const studio = await studioSession();
  if (!studio) redirect("/studio/signin");
  return studio;
}
