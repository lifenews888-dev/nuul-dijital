import Link from "next/link";
import { Pencil, DownloadCloud } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteProject, importFromVercel } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  await requireUser();
  const projects = await safe(
    () => db.project.findMany({ orderBy: { createdAt: "desc" } }),
    [] as Awaited<ReturnType<typeof db.project.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Төслүүд" description="Портфолио төслүүдийг удирдах" newHref="/admin/projects/new" />
      <form action={importFromVercel} className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-card p-4">
        <Button type="submit" variant="outline" size="sm">
          <DownloadCloud className="size-4" /> Vercel-ээс импорт
        </Button>
        <span className="text-xs text-muted-foreground">
          Vercel төслүүдийг ноорог болгож татна (VERCEL_API_TOKEN тохируулсан үед).
        </span>
      </form>
      {projects.length === 0 ? (
        <EmptyState message="Төсөл алга байна." />
      ) : (
        <TableShell head={["Нэр", "Салбар", "Он", "Төлөв", ""]}>
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-medium">{p.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.industry}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.year}</td>
              <td className="px-4 py-3">
                {p.status === "PUBLISHED" ? (
                  <Badge variant="accent">Нийтэлсэн</Badge>
                ) : (
                  <Badge>Ноорог</Badge>
                )}
                {p.featured && <Badge variant="cyan">Онцлох</Badge>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/projects/${p.id}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <DeleteButton action={deleteProject} id={p.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
