import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteJob } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminCareersPage() {
  await requireUser();
  const jobs = await safe(
    () => db.job.findMany({ orderBy: { createdAt: "desc" } }),
    [] as Awaited<ReturnType<typeof db.job.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Ажлын байр" description="Нээлттэй ажлын байрыг удирдах" newHref="/admin/careers/new" />
      {jobs.length === 0 ? (
        <EmptyState message="Ажлын байр алга байна." />
      ) : (
        <TableShell head={["Албан тушаал", "Хэлтэс", "Байршил", "Төлөв", ""]}>
          {jobs.map((j) => (
            <tr key={j.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-medium">{j.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{j.department}</td>
              <td className="px-4 py-3 text-muted-foreground">{j.location}</td>
              <td className="px-4 py-3">
                {j.active ? <Badge variant="accent">Идэвхтэй</Badge> : <Badge>Хаалттай</Badge>}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/careers/${j.id}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <DeleteButton action={deleteJob} id={j.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
