import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { toggleContactRead, deleteContact } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminContactsPage() {
  await requireUser();
  const messages = await safe(
    () => db.contactMessage.findMany({ orderBy: { createdAt: "desc" } }),
    [] as Awaited<ReturnType<typeof db.contactMessage.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Холбоо барих хүсэлт" description="Холбоо барих формоор ирсэн зурвасууд" />
      {messages.length === 0 ? (
        <EmptyState message="Зурвас алга байна." />
      ) : (
        <TableShell head={["Нэр / Имэйл", "Зурвас", "Төлөв", "Огноо", ""]}>
          {messages.map((m) => (
            <tr key={m.id} className="align-top hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-muted-foreground">{m.email}</div>
                {m.company && <div className="text-sm text-muted-foreground">{m.company}</div>}
              </td>
              <td className="max-w-md px-4 py-3 text-muted-foreground">{m.message}</td>
              <td className="px-4 py-3">
                <form action={toggleContactRead}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="read" value={(!m.read).toString()} />
                  <button type="submit">
                    {m.read ? <Badge>Уншсан</Badge> : <Badge variant="accent">Шинэ</Badge>}
                  </button>
                </form>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(m.createdAt)}</td>
              <td className="px-4 py-3">
                <DeleteButton action={deleteContact} id={m.id} />
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
