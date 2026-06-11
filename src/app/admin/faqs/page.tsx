import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteFaq } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminFaqsPage() {
  await requireUser();
  const faqs = await safe(
    () => db.faq.findMany({ orderBy: { order: "asc" } }),
    [] as Awaited<ReturnType<typeof db.faq.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Түгээмэл асуултууд" description="FAQ-уудыг удирдах" newHref="/admin/faqs/new" />
      {faqs.length === 0 ? (
        <EmptyState message="FAQ алга байна." />
      ) : (
        <TableShell head={["Асуулт", "Ангилал", "Төлөв", ""]}>
          {faqs.map((f) => (
            <tr key={f.id} className="hover:bg-white/[0.02]">
              <td className="max-w-md px-4 py-3 font-medium">{f.question}</td>
              <td className="px-4 py-3 text-muted-foreground">{f.category}</td>
              <td className="px-4 py-3">{f.published ? <Badge variant="accent">Нийтэлсэн</Badge> : <Badge>Ноорог</Badge>}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/faqs/${f.id}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <DeleteButton action={deleteFaq} id={f.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
