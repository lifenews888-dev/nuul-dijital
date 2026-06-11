import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteValue } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminValuesPage() {
  await requireUser();
  const values = await safe(
    () => db.value.findMany({ orderBy: { order: "asc" } }),
    [] as Awaited<ReturnType<typeof db.value.findMany>>
  );
  return (
    <div>
      <AdminHeader title="Үнэт зүйлс" description="«Яагаад Nuul» хэсгийн үнэт зүйлс" newHref="/admin/values/new" />
      {values.length === 0 ? (
        <EmptyState message="Үнэт зүйл алга байна." />
      ) : (
        <TableShell head={["Гарчиг", "Тайлбар", "Төлөв", ""]}>
          {values.map((v) => (
            <tr key={v.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-medium">{v.title}</td>
              <td className="max-w-md px-4 py-3 text-muted-foreground line-clamp-1">{v.description}</td>
              <td className="px-4 py-3">{v.active ? <Badge variant="accent">Идэвхтэй</Badge> : <Badge>Нуусан</Badge>}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/admin/values/${v.id}`} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground">
                    <Pencil className="size-4" />
                  </Link>
                  <DeleteButton action={deleteValue} id={v.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
