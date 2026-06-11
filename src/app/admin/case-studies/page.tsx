import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteCaseStudy } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

export default async function AdminCaseStudiesPage() {
  await requireUser();
  const items = await safe(
    () => db.caseStudy.findMany({ orderBy: { createdAt: "desc" } }),
    [] as Awaited<ReturnType<typeof db.caseStudy.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Кейс судалгаа" description="Кейс судалгаануудыг удирдах" newHref="/admin/case-studies/new" />
      {items.length === 0 ? (
        <EmptyState message="Кейс судалгаа алга байна." />
      ) : (
        <TableShell head={["Гарчиг", "Үйлчлүүлэгч", "Салбар", ""]}>
          {items.map((c) => (
            <tr key={c.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-medium">{c.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.client}</td>
              <td className="px-4 py-3 text-muted-foreground">{c.industry}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/case-studies/${c.id}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <DeleteButton action={deleteCaseStudy} id={c.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
