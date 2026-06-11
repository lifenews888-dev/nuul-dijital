import Link from "next/link";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteTeamMember } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  await requireUser();
  const members = await safe(
    () => db.teamMember.findMany({ orderBy: { order: "asc" } }),
    [] as Awaited<ReturnType<typeof db.teamMember.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Баг" description="Багийн гишүүдийг удирдах" newHref="/admin/team/new" />
      {members.length === 0 ? (
        <EmptyState message="Багийн гишүүн алга байна." />
      ) : (
        <TableShell head={["Гишүүн", "Албан тушаал", "Төлөв", ""]}>
          {members.map((m) => (
            <tr key={m.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Image src={m.avatar} alt={m.name} width={36} height={36} className="size-9 rounded-full object-cover" />
                  <span className="font-medium">{m.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{m.role}</td>
              <td className="px-4 py-3">{m.active ? <Badge variant="accent">Идэвхтэй</Badge> : <Badge>Нуусан</Badge>}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/team/${m.id}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <DeleteButton action={deleteTeamMember} id={m.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
