import { redirect } from "next/navigation";
import type { Organization } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const STAFF_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "EDITOR", "AUTHOR"]);

export type AppUser = {
  id: string;
  name?: string | null;
  email: string;
  role: string;
};

export type AppContext = {
  user: AppUser;
  organization: Organization;
};

export async function getAppUser(): Promise<AppUser | null> {
  try {
    const session = await auth();
    const user = session?.user as AppUser | undefined;
    if (!user?.email || !user.id) return null;
    if (STAFF_ROLES.has(user.role ?? "")) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireAppUser(): Promise<AppUser> {
  const user = await getAppUser();
  if (!user) redirect("/app/login");
  return user;
}

export async function getAppContext(): Promise<AppContext | null> {
  const user = await getAppUser();
  if (!user || !process.env.DATABASE_URL) return null;

  try {
    const membership = await db.orgMember.findFirst({
      where: { userId: user.id, role: "OWNER" },
      include: { org: true },
      orderBy: { createdAt: "asc" },
    });
    if (!membership) return null;
    return { user, organization: membership.org };
  } catch {
    return null;
  }
}

export async function requireAppContext(): Promise<AppContext> {
  const user = await requireAppUser();
  if (!process.env.DATABASE_URL) redirect("/app/login");

  const membership = await db.orgMember.findFirst({
    where: { userId: user.id, role: "OWNER" },
    include: { org: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) redirect("/app/login");
  return { user, organization: membership.org };
}