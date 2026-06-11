import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteProject } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";

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
      {projects.length === 0 ? (
        <EmptyState message="Төсөл алга байна." />
      ) : (
        <TableShell head={["Нэр", "Салбар", "Он", "Онцлох", ""]}>
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-medium">{p.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.industry}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.year}</td>
              <td className="px-4 py-3">{p.featured && <Badge variant="accent">Онцлох</Badge>}</td>
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
