import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteStat } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage() {
  await requireUser();
  const stats = await safe(
    () => db.stat.findMany({ orderBy: { order: "asc" } }),
    [] as Awaited<ReturnType<typeof db.stat.findMany>>
  );
  return (
    <div>
      <AdminHeader title="Статистик" description="Нүүрний тоон үзүүлэлтүүд" newHref="/admin/stats/new" />
      {stats.length === 0 ? (
        <EmptyState message="Статистик алга байна." />
      ) : (
        <TableShell head={["Утга", "Тайлбар", "Төлөв", ""]}>
          {stats.map((s) => (
            <tr key={s.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-medium">{s.value}{s.suffix}</td>
              <td className="px-4 py-3 text-muted-foreground">{s.label}</td>
              <td className="px-4 py-3">{s.active ? <Badge variant="accent">Идэвхтэй</Badge> : <Badge>Нуусан</Badge>}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/admin/stats/${s.id}`} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground">
                    <Pencil className="size-4" />
                  </Link>
                  <DeleteButton action={deleteStat} id={s.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
