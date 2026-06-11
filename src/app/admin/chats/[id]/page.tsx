import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, Bot, User } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const session = await safe(
    () => db.chatSession.findUnique({ where: { id }, include: { messages: { orderBy: { createdAt: "asc" } } } }),
    null
  );
  if (!session) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/chats" className="mb-4 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
        <ArrowLeft className="size-4" /> Бүх чат
      </Link>
      <AdminHeader title="AI чатын түүх" description={formatDate(session.createdAt)} />

      {(session.email || session.phone) && (
        <div className="mb-6 flex flex-wrap gap-4 rounded-2xl border border-accent/30 bg-accent/10 p-4 text-sm">
          <span className="font-semibold text-foreground">Илрүүлсэн холбоо:</span>
          {session.email && (
            <a href={`mailto:${session.email}`} className="flex items-center gap-1.5 text-accent">
              <Mail className="size-4" /> {session.email}
            </a>
          )}
          {session.phone && (
            <a href={`tel:${session.phone}`} className="flex items-center gap-1.5 text-accent">
              <Phone className="size-4" /> {session.phone}
            </a>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-card p-5">
        {session.messages.map((m) => (
          <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "")}>
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full",
                m.role === "user" ? "bg-accent text-white" : "bg-white/5 text-accent"
              )}
            >
              {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
            </div>
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                m.role === "user" ? "bg-accent text-white" : "bg-white/5 text-foreground"
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
