import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export const SETTINGS_TAG = "site-settings";

/**
 * Reads the admin-configured site logo URL (cached, tag-revalidated).
 * Returns null when unset or no DB — callers fall back to the built-in vector mark.
 * Because this is cached, the root layout can use it without forcing every page
 * to render dynamically (pages stay static / ISR).
 */
export const getLogoUrl = unstable_cache(
  async (): Promise<string | null> => {
    if (!process.env.DATABASE_URL) return null;
    try {
      const row = await db.siteSetting.findUnique({ where: { key: "logoUrl" } });
      return row?.value || null;
    } catch {
      return null;
    }
  },
  ["site-logo-url"],
  { tags: [SETTINGS_TAG], revalidate: 3600 }
);

/**
 * Vercel integration credentials, configurable in /admin/settings. Falls back
 * to the VERCEL_API_TOKEN / VERCEL_TEAM_ID env vars. Read directly (uncached)
 * so the token never lands in the Next data cache.
 */
export async function getVercelConfig(): Promise<{ token: string | null; teamId: string | null }> {
  let token = process.env.VERCEL_API_TOKEN || null;
  let teamId = process.env.VERCEL_TEAM_ID || null;
  if (process.env.DATABASE_URL) {
    try {
      const rows = await db.siteSetting.findMany({
        where: { key: { in: ["vercelApiToken", "vercelTeamId"] } },
      });
      for (const r of rows) {
        if (r.key === "vercelApiToken" && r.value) token = r.value;
        if (r.key === "vercelTeamId" && r.value) teamId = r.value;
      }
    } catch {
      // keep env fallback
    }
  }
  return { token, teamId };
}
