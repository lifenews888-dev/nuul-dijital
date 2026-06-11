import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deletePage } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell, StatusBadge } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  await requireUser();
  const pages = await safe(
    () => db.page.findMany({ orderBy: { updatedAt: "desc" } }),
    [] as Awaited<ReturnType<typeof db.page.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Хуудаснууд" description="Статик хуудсуудыг удирдах" newHref="/admin/pages/new" />
      {pages.length === 0 ? (
        <EmptyState message="Хуудас алга байна." />
      ) : (
        <TableShell head={["Гарчиг", "Slug", "Төлөв", "Шинэчилсэн", ""]}>
          {pages.map((p) => (
            <tr key={p.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-medium">{p.title}</td>
              <td className="px-4 py-3 text-muted-foreground">/{p.slug}</td>
              <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(p.updatedAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/pages/${p.id}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <DeleteButton action={deletePage} id={p.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
