import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { StatusSelect } from "@/components/admin/status-select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { requirePermission, safe } from "@/lib/admin";
import {
  assignSupportTicket,
  replySupportTicket,
  setSupportTicketStatus,
} from "@/app/admin/support/actions";
import { getAdminTicketDetail, listStaffAssignees } from "@/lib/support/tickets";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = [
  { value: "NEW", label: "Шинэ" },
  { value: "ASSIGNED", label: "Хуваарилсан" },
  { value: "INVESTIGATING", label: "Шалгаж байна" },
  { value: "WAITING_CUSTOMER", label: "Хариу хүлээж буй" },
  { value: "RESOLVED", label: "Шийдсэн" },
  { value: "CLOSED", label: "Хаасан" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  if (children == null || children === "" || children === "—") return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

export default async function AdminSupportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermission("leads", "read");
  const { id } = await params;

  const [ticket, staff] = await Promise.all([
    safe(() => getAdminTicketDetail(id), null),
    safe(() => listStaffAssignees(), []),
  ]);

  if (!ticket) notFound();

  return (
    <div className="max-w-5xl">
      <Link
        href="/admin/support"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
      >
        <ArrowLeft className="size-4" />
        Буцах
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <p className="font-mono text-sm text-muted-foreground">{ticket.number}</p>
        </div>
        <StatusSelect
          action={setSupportTicketStatus}
          id={ticket.id}
          value={ticket.status}
          options={STATUS_OPTIONS}
        />
      </div>

      <div className="mb-6 grid gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Байгууллага">{ticket.organization.name}</Field>
        <Field label="Үйлчлүүлэгч">
          {ticket.user.name ?? ticket.user.email}
          <span className="block text-muted-foreground">{ticket.user.email}</span>
        </Field>
        <Field label="Хуваарилсан">
          {ticket.assignedTo ? (ticket.assignedTo.name ?? ticket.assignedTo.email) : "—"}
        </Field>
        <Field label="Ангилал">{ticket.category}</Field>
        <Field label="Эрэмбэ">{ticket.priority}</Field>
        <Field label="SLA төлөвлөгөө">{ticket.slaPlanKey ?? "free"}</Field>
        <Field label="SLA хугацаа">
          {ticket.slaDueAt ? formatDate(ticket.slaDueAt) : "—"}
        </Field>
        <Field label="Эхний хариу">
          {ticket.firstResponseAt ? formatDate(ticket.firstResponseAt) : "—"}
        </Field>
        <Field label="Үүссэн">{formatDate(ticket.createdAt)}</Field>
      </div>

      <form action={assignSupportTicket} className="mb-6 flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={ticket.id} />
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Хуваарилах</label>
          <select
            name="assignedToId"
            defaultValue={ticket.assignedTo?.id ?? ""}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
          >
            <option value="">— Сонгоогүй —</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id} className="bg-card">
                {s.name ?? s.email}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" variant="outline" size="sm">
          Хадгалах
        </Button>
      </form>

      <div className="mb-6 space-y-3">
        <h2 className="text-lg font-semibold">Мессежүүд</h2>
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "rounded-xl border px-4 py-3",
              msg.isInternal
                ? "border-amber-500/30 bg-amber-500/5"
                : msg.authorKind === "STAFF"
                  ? "border-white/10 bg-white/[0.03]"
                  : "border-accent/20 bg-accent/5"
            )}
          >
            <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                {msg.authorKind === "CUSTOMER"
                  ? "Үйлчлүүлэгч"
                  : msg.authorKind === "STAFF"
                    ? "Ажилтан"
                    : "Систем"}
              </span>
              {msg.authorUser && <span>{msg.authorUser.email}</span>}
              {msg.isInternal && (
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-amber-200">
                  Дотоод
                </span>
              )}
              <span>{formatDate(msg.createdAt)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{msg.body}</p>
          </div>
        ))}
      </div>

      <form action={replySupportTicket} className="space-y-3 rounded-xl border border-white/10 p-4">
        <input type="hidden" name="id" value={ticket.id} />
        <h2 className="font-semibold">Хариу бичих</h2>
        <Textarea name="body" rows={4} required placeholder="Хариу эсвэл тэмдэглэл..." />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="isInternal" className="rounded" />
          Дотоод тэмдэглэл (үйлчлүүлэгчид харагдахгүй)
        </label>
        <Button type="submit" size="sm">
          Илгээх
        </Button>
      </form>
    </div>
  );
}