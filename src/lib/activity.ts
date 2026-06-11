import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/admin";

type LogArgs = {
  action: "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "ARCHIVE" | "RESTORE" | "LOGIN";
  entity: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

/**
 * Append an audit-trail entry. Best-effort — never throws into the calling
 * server action (auditing must not block content operations).
 */
export async function logActivity({ action, entity, entityId, summary, metadata }: LogArgs) {
  if (!process.env.DATABASE_URL) return;
  try {
    const user = await getSessionUser();
    await db.activityLog.create({
      data: {
        // attribute by email; FK userId set only for DB-backed users
        userEmail: user?.email ?? null,
        action,
        entity,
        entityId,
        summary,
        metadata: metadata ? (metadata as object) : undefined,
      },
    });
  } catch (err) {
    console.error("[activity]", err);
  }
}
