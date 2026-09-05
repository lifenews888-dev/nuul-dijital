import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteSoftwareVendor } from "@/app/(admin)/admin/catalogue/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { RegistryIcon } from "@/components/shared/registry-icon";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminSoftwareVendorsPage() {
  await requireUser();
  const vendors = await safe(
    () =>
      db.softwareVendor.findMany({
        orderBy: { priority: "asc" },
        include: { _count: { select: { categories: true } } },
      }),
    []
  );

  return (
    <div>
      <AdminHeader
        title="Программ хангамж"
        description="Үйлдвэрлэгчид. Хоосон бол кодын каталог харагдана."
        newHref="/admin/catalogue/software/new"
      />
      {vendors.length === 0 ? (
        <EmptyState message="Үйлдвэрлэгч нэмээгүй байна — сайт одоогоор кодод суулгасан каталогийг харуулж байна." />
      ) : (
        <TableShell head={["Үйлдвэрлэгч", "Ангилал", "Үнэ", "Медиа", "Төлөв", ""]}>
          {vendors.map((v) => (
            <tr key={v.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <RegistryIcon name={v.icon} className="size-4" />
                  </span>
                  <div>
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-muted-foreground">{v.slug}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{v._count.categories}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {v.priceMnt ? `${v.priceMnt.toLocaleString("mn-MN")}₮` : "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {[v.image && "зураг", v.gallery.length && `цомог ${v.gallery.length}`, v.videoUrl && "видео"]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </td>
              <td className="px-4 py-3">
                {v.active ? <Badge variant="accent">Идэвхтэй</Badge> : <Badge>Нуусан</Badge>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/catalogue/software/${v.id}`}
                    aria-label="Засах"
                    className="flex size-8 items-center justify-center rounded-lg border border-white/10 hover:border-white/25"
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                  <DeleteButton action={deleteSoftwareVendor} id={v.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
