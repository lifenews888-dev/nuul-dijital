import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteSoftwareCategory } from "@/app/(admin)/admin/catalogue/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { GROUP_LABELS, type CategoryGroup } from "@/data/software";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminSoftwareCategoriesPage() {
  await requireUser();
  const categories = await safe(
    () =>
      db.softwareCategory.findMany({
        orderBy: [{ group: "asc" }, { order: "asc" }],
        include: { _count: { select: { vendors: true } } },
      }),
    []
  );

  return (
    <div>
      <AdminHeader
        title="Программын ангилал"
        description="Каталогийн ангиллууд. Хоосон бол кодын жагсаалт харагдана."
        newHref="/admin/catalogue/categories/new"
      />
      {categories.length === 0 ? (
        <EmptyState message="Ангилал нэмээгүй байна — сайт одоогоор кодод суулгасан жагсаалтыг харуулж байна." />
      ) : (
        <TableShell head={["Ангилал", "Бүлэг", "Үйлдвэрлэгч", "Төлөв", ""]}>
          {categories.map((c) => (
            <tr key={c.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-muted-foreground">{c.slug}</div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {GROUP_LABELS[c.group as CategoryGroup] ?? c.group}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{c._count.vendors}</td>
              <td className="px-4 py-3">
                {c.active ? <Badge variant="accent">Идэвхтэй</Badge> : <Badge>Нуусан</Badge>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/catalogue/categories/${c.id}`}
                    aria-label="Засах"
                    className="flex size-8 items-center justify-center rounded-lg border border-white/10 hover:border-white/25"
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                  <DeleteButton action={deleteSoftwareCategory} id={c.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
