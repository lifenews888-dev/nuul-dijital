import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteChat } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminChatsPage() {
  await requireUser();
  const sessions = await safe(
    () =>
      db.chatSession.findMany({
        orderBy: { updatedAt: "desc" },
        take: 100,
        include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      }),
    [] as Awaited<ReturnType<typeof db.chatSession.findMany>>
  );

  return (
    <div>
      <AdminHeader title="AI чатууд" description="Зочдын AI туслахтай хийсэн харилцаа" />
      {sessions.length === 0 ? (
        <EmptyState message="Чат бүртгэгдээгүй байна." />
      ) : (
        <TableShell head={["Сүүлийн зурвас", "Холбоо", "Зурвас", "Огноо", ""]}>
          {sessions.map((s) => {
            const last = (s as typeof s & { messages: { content: string }[] }).messages[0];
            return (
              <tr key={s.id} className="align-top hover:bg-white/[0.02]">
                <td className="max-w-md px-4 py-3">
                  <Link href={`/admin/chats/${s.id}`} className="font-medium hover:text-accent">
                    {last ? last.content.slice(0, 80) : "—"}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {s.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="size-3.5 text-accent" /> {s.email}
                    </div>
                  )}
                  {s.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-accent" /> {s.phone}
                    </div>
                  )}
                  {!s.email && !s.phone && "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge>{s.messageCount}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(s.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/chats/${s.id}`}
                      className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                    >
                      Үзэх <ArrowRight className="size-3.5" />
                    </Link>
                    <DeleteButton action={deleteChat} id={s.id} />
                  </div>
                </td>
              </tr>
            );
          })}
        </TableShell>
      )}
    </div>
  );
}
