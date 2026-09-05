import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteService } from "@/app/(admin)/admin/catalogue/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { RegistryIcon } from "@/components/shared/registry-icon";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminServicesCataloguePage() {
  await requireUser();
  const services = await safe(
    () => db.service.findMany({ orderBy: { order: "asc" } }),
    [] as Awaited<ReturnType<typeof db.service.findMany>>
  );

  return (
    <div>
      <AdminHeader
        title="Үйлчилгээ"
        description="Нийтийн сайтын үйлчилгээний каталог. Хоосон бол кодын жагсаалт харагдана."
        newHref="/admin/catalogue/services/new"
      />
      {services.length === 0 ? (
        <EmptyState message="Үйлчилгээ нэмээгүй байна — сайт одоогоор кодод суулгасан жагсаалтыг харуулж байна." />
      ) : (
        <TableShell head={["Үйлчилгээ", "Slug", "Үнэ", "Медиа", "Төлөв", ""]}>
          {services.map((s) => (
            <tr key={s.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <RegistryIcon name={s.icon} className="size-4" />
                  </span>
                  <span className="font-medium">{s.title}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{s.slug}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {s.priceMnt ? `${s.priceMnt.toLocaleString("mn-MN")}₮` : "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {[s.image && "зураг", s.gallery.length && `цомог ${s.gallery.length}`, s.videoUrl && "видео"]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </td>
              <td className="px-4 py-3">
                {s.active ? <Badge variant="accent">Идэвхтэй</Badge> : <Badge>Нуусан</Badge>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/catalogue/services/${s.id}`}
                    aria-label="Засах"
                    className="flex size-8 items-center justify-center rounded-lg border border-white/10 hover:border-white/25"
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                  <DeleteButton action={deleteService} id={s.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
