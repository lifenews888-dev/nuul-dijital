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
