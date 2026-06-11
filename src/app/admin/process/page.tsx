import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteProcessStep } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminProcessPage() {
  await requireUser();
  const steps = await safe(
    () => db.processStep.findMany({ orderBy: { order: "asc" } }),
    [] as Awaited<ReturnType<typeof db.processStep.findMany>>
  );
  return (
    <div>
      <AdminHeader title="Ажлын явц" description="«Санаанаас үр дүн хүртэл» алхмууд" newHref="/admin/process/new" />
      {steps.length === 0 ? (
        <EmptyState message="Алхам алга байна." />
      ) : (
        <TableShell head={["Дугаар", "Гарчиг", "Icon", "Төлөв", ""]}>
          {steps.map((s) => (
            <tr key={s.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-medium">{s.step}</td>
              <td className="px-4 py-3">{s.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{s.icon}</td>
              <td className="px-4 py-3">{s.active ? <Badge variant="accent">Идэвхтэй</Badge> : <Badge>Нуусан</Badge>}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link href={`/admin/process/${s.id}`} className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground">
                    <Pencil className="size-4" />
                  </Link>
                  <DeleteButton action={deleteProcessStep} id={s.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
