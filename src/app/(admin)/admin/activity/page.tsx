import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ACTION_VARIANT: Record<string, "default" | "accent" | "cyan"> = {
  CREATE: "accent",
  PUBLISH: "accent",
  UPDATE: "cyan",
  RESTORE: "cyan",
  DELETE: "default",
  ARCHIVE: "default",
  LOGIN: "default",
};

export default async function AdminActivityPage() {
  await requireUser();
  const logs = await safe(
    () => db.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    [] as Awaited<ReturnType<typeof db.activityLog.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Үйл ажиллагааны түүх" description="Аудит лог — сүүлийн 200 бичлэг" />
      {logs.length === 0 ? (
        <EmptyState message="Бүртгэл алга байна." />
      ) : (
        <TableShell head={["Үйлдэл", "Тайлбар", "Хэрэглэгч", "Огноо"]}>
          {logs.map((l) => (
            <tr key={l.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <Badge variant={ACTION_VARIANT[l.action] ?? "default"}>{l.action}</Badge>
              </td>
              <td className="px-4 py-3">{l.summary}</td>
              <td className="px-4 py-3 text-muted-foreground">{l.userEmail ?? "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(l.createdAt)}</td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
