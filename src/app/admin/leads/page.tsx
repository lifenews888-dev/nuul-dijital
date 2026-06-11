import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { setLeadStatus, deleteLead } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { StatusSelect } from "@/components/admin/status-select";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS = [
  { value: "NEW", label: "Шинэ" },
  { value: "CONTACTED", label: "Холбогдсон" },
  { value: "QUALIFIED", label: "Шалгарсан" },
  { value: "WON", label: "Хожсон" },
  { value: "LOST", label: "Алдсан" },
];

export default async function AdminLeadsPage() {
  await requireUser();
  const leads = await safe(
    () => db.lead.findMany({ orderBy: { createdAt: "desc" } }),
    [] as Awaited<ReturnType<typeof db.lead.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Лидүүд" description="Үнийн санал хүсэлтүүд (quote requests)" />
      {leads.length === 0 ? (
        <EmptyState message="Лид алга байна." />
      ) : (
        <TableShell head={["Нэр / Имэйл", "Үйлчилгээ", "Төсөв", "Төлөв", "Огноо", ""]}>
          {leads.map((l) => (
            <tr key={l.id} className="align-top hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <div className="font-medium">{l.name}</div>
                <div className="text-sm text-muted-foreground">{l.email}</div>
                {l.phone && <div className="text-sm text-muted-foreground">{l.phone}</div>}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{l.services.join(", ")}</td>
              <td className="px-4 py-3 text-muted-foreground">{l.budget ?? "—"}</td>
              <td className="px-4 py-3">
                <StatusSelect action={setLeadStatus} id={l.id} value={l.status} options={STATUS} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(l.createdAt)}</td>
              <td className="px-4 py-3">
                <DeleteButton action={deleteLead} id={l.id} />
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
