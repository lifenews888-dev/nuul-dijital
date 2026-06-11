import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { setMeetingStatus, deleteMeeting } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { StatusSelect } from "@/components/admin/status-select";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS = [
  { value: "REQUESTED", label: "Хүсэлт" },
  { value: "SCHEDULED", label: "Товлосон" },
  { value: "DONE", label: "Болсон" },
  { value: "CANCELLED", label: "Цуцалсан" },
];

export default async function AdminMeetingsPage() {
  await requireUser();
  const meetings = await safe(
    () => db.meeting.findMany({ orderBy: { createdAt: "desc" } }),
    [] as Awaited<ReturnType<typeof db.meeting.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Уулзалтууд" description="Уулзалт захиалгын хүсэлтүүд" />
      {meetings.length === 0 ? (
        <EmptyState message="Уулзалтын хүсэлт алга байна." />
      ) : (
        <TableShell head={["Нэр / Имэйл", "Тохирох цаг", "Сэдэв", "Төлөв", "Огноо", ""]}>
          {meetings.map((m) => (
            <tr key={m.id} className="align-top hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-muted-foreground">{m.email}</div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{m.preferredAt}</td>
              <td className="px-4 py-3 text-muted-foreground">{m.topic ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusSelect action={setMeetingStatus} id={m.id} value={m.status} options={STATUS} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(m.createdAt)}</td>
              <td className="px-4 py-3">
                <DeleteButton action={deleteMeeting} id={m.id} />
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
