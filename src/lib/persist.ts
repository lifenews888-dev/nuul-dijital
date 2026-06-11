import type { PrismaClient } from "@prisma/client";

/**
 * Best-effort persistence helper.
 *
 * Runs a Prisma write only when a DATABASE_URL is configured, and never throws
 * back to the caller — form submissions must still succeed (email already sent)
 * even if the database is unreachable. Returns the result or null.
 */
export async function persist<T>(fn: (db: PrismaClient) => Promise<T>): Promise<T | null> {
  if (!process.env.DATABASE_URL) {
    console.info("[persist] DATABASE_URL not set — skipping DB write.");
    return null;
  }
  try {
    const { db } = await import("./db");
    return await fn(db);
  } catch (err) {
    console.error("[persist] DB write failed:", err);
    return null;
  }
}
