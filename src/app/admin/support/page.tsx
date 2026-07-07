import Link from "next/link";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { requirePermission, safe } from "@/lib/admin";
import { listAdminTickets } from "@/lib/support/tickets";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  NEW: "Шинэ",
  ASSIGNED: "Хуваарилсан",
  INVESTIGATING: "Шалгаж байна",
  WAITING_CUSTOMER: "Хариу хүлээж буй",
  RESOLVED: "Шийдсэн",
  CLOSED: "Хаасан",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Бага",
  NORMAL: "Энгийн",
  HIGH: "Өндөр",
  URGENT: "Яаралтай",
};

function slaIndicator(slaDueAt: Date | null, firstResponseAt: Date | null): string {
  if (firstResponseAt) return "text-emerald-400";
  if (!slaDueAt) return "text-muted-foreground";
  return slaDueAt.getTime() < Date.now() ? "text-red-400" : "text-amber-300";
}

export default async function AdminSupportPage() {
  await requirePermission("leads", "read");
  const tickets = await safe(() => listAdminTickets(), [] as Awaited<ReturnType<typeof listAdminTickets>>);

  return (
    <div>
      <AdminHeader
        title="Дэмжлэг"
        description="Үйлчлүүлэгчийн тикет, SLA, хариу өгөх"
      />
      {tickets.length === 0 ? (
        <EmptyState message="Тикет алга байна." />
      ) : (
        <TableShell
          head={["Дугаар", "Гарчиг", "Байгууллага", "Төлөв", "Эрэмбэ", "SLA", "Шинэчлэгдсэн", ""]}
        >
          {tickets.map((t) => (
            <tr key={t.id} className="align-top hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-mono text-sm">{t.number}</td>
              <td className="px-4 py-3">
                <div className="font-medium">{t.subject}</div>
                <div className="text-sm text-muted-foreground">{t.user.email}</div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{t.organization.name}</td>
              <td className="px-4 py-3">{STATUS_LABELS[t.status] ?? t.status}</td>
              <td className="px-4 py-3">{PRIORITY_LABELS[t.priority] ?? t.priority}</td>
              <td className={`px-4 py-3 text-sm ${slaIndicator(t.slaDueAt, t.firstResponseAt)}`}>
                {t.firstResponseAt
                  ? formatDate(t.firstResponseAt)
                  : t.slaDueAt
                    ? formatDate(t.slaDueAt)
                    : "—"}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(t.updatedAt)}</td>
              <td className="px-4 py-3">
                <Link href={`/admin/support/${t.id}`} className="text-sm text-accent hover:underline">
                  Нээх
                </Link>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}