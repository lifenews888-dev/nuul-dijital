import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/admin";

export type RevisionEntity = "Post" | "Project" | "CaseStudy" | "Page";

/**
 * Snapshot the full record into ContentRevision (version history).
 * Versions are monotonic per (entity, entityId). Best-effort.
 */
export async function snapshotRevision(
  entity: RevisionEntity,
  entityId: string,
  data: Record<string, unknown>
) {
  if (!process.env.DATABASE_URL) return;
  try {
    const user = await getSessionUser();
    const last = await db.contentRevision.findFirst({
      where: { entity, entityId },
      orderBy: { version: "desc" },
      select: { version: true },
    });
    await db.contentRevision.create({
      data: {
        entity,
        entityId,
        version: (last?.version ?? 0) + 1,
        data: JSON.parse(JSON.stringify(data)),
        authorEmail: user?.email ?? null,
      },
    });
  } catch (err) {
    console.error("[revision]", err);
  }
}

/** Fetch revision history for an entity (newest first). */
export async function listRevisions(entity: RevisionEntity, entityId: string) {
  if (!process.env.DATABASE_URL) return [];
  try {
    return await db.contentRevision.findMany({
      where: { entity, entityId },
      orderBy: { version: "desc" },
    });
  } catch {
    return [];
  }
}
