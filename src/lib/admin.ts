import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { assertCan, type Resource, type Action } from "@/lib/rbac";

export type SessionUser = { id?: string; name?: string | null; email?: string | null; role?: string };

/** Returns the current session user, or null (never throws — auth may be unconfigured in dev). */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const session = await auth();
    return (session?.user as SessionUser) ?? null;
  } catch {
    return null;
  }
}

/** Guard for admin pages — redirects to login when not authenticated. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Guard for mutations by explicit roles. */
export async function requireRole(
  roles: string[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"]
): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role && !roles.includes(user.role)) {
    throw new Error("Forbidden: insufficient role");
  }
  return user;
}

/** RBAC guard for mutations — checks the role against the permission matrix. */
export async function requirePermission(resource: Resource, action: Action): Promise<SessionUser> {
  const user = await requireUser();
  assertCan(user.role, resource, action);
  return user;
}

// --- Content workflow helpers (status + SEO from FormData) ---

export function statusFields(fd: FormData) {
  const status = (str(fd, "status") || "DRAFT") as "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";
  const scheduledRaw = str(fd, "scheduledAt");
  return {
    status,
    scheduledAt: status === "SCHEDULED" && scheduledRaw ? new Date(scheduledRaw) : null,
    publishedAt: status === "PUBLISHED" ? new Date() : null,
  };
}

export function seoFields(fd: FormData) {
  return {
    seoTitle: optStr(fd, "seoTitle"),
    seoDescription: optStr(fd, "seoDescription"),
    seoKeywords: lines(fd, "seoKeywords"),
    ogImage: optStr(fd, "ogImage"),
    canonicalUrl: optStr(fd, "canonicalUrl"),
  };
}

/**
 * Safe DB read for admin pages — returns `fallback` when no DATABASE_URL is set
 * or the query throws, so the dashboard always renders (empty) without a database.
 */
export async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.error("[admin/safe]", err);
    return fallback;
  }
}

// --- FormData parsing helpers ---
export const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
export const optStr = (fd: FormData, k: string) => {
  const v = str(fd, k);
  return v.length ? v : undefined;
};
export const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
export const num = (fd: FormData, k: string, fallback = 0) => {
  const n = Number(fd.get(k));
  return Number.isFinite(n) ? n : fallback;
};
/** Split a textarea into a trimmed, non-empty string array (newline-separated). */
export const lines = (fd: FormData, k: string) =>
  str(fd, k)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
/** Parse a JSON textarea, returning fallback on error. */
export const json = <T>(fd: FormData, k: string, fallback: T): T => {
  const v = str(fd, k);
  if (!v) return fallback;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
};
