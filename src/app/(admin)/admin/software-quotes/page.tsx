import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import {
  setSoftwareQuoteStatus,
  deleteSoftwareQuote,
} from "@/app/(admin)/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { StatusSelect } from "@/components/admin/status-select";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS = [
  { value: "NEW", label: "Шинэ" },
  { value: "CONTACTED", label: "Холбогдсон" },
  { value: "QUALIFIED", label: "Шалгарсан" },
  { value: "WON", label: "Хожсон" },
  { value: "LOST", label: "Алдсан" },
];

/**
 * Software licence enquiries from /software/request.
 *
 * The form has been writing to this table all along, but nothing read it: there
 * was no screen here, and the notification email is skipped whenever
 * RESEND_API_KEY is unset, which it is in production. An enquiry therefore
 * reached nobody. This is where they land now.
 */
export default async function AdminSoftwareQuotesPage() {
  await requireUser();
  const quotes = await safe(
    () => db.softwareQuote.findMany({ orderBy: { createdAt: "desc" } }),
    [] as Awaited<ReturnType<typeof db.softwareQuote.findMany>>
  );

  return (
    <div>
      <AdminHeader
        title="Лицензийн хүсэлт"
        description="Программ хангамжийн үнийн санал хүссэн байгууллагууд"
      />
      {quotes.length === 0 ? (
        <EmptyState message="Лицензийн хүсэлт алга байна." />
      ) : (
        <TableShell
          head={["Байгууллага", "Холбоо барих", "Хүссэн зүйл", "Төлөв", "Огноо", ""]}
        >
          {quotes.map((q) => (
            <tr key={q.id} className="align-top hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <Link
                  href={`/admin/software-quotes/${q.id}`}
                  className="font-medium hover:text-accent hover:underline"
                >
                  {q.company}
                </Link>
                {q.regNumber && (
                  <div className="text-sm text-muted-foreground">ТТД: {q.regNumber}</div>
                )}
              </td>

              <td className="px-4 py-3">
                <div className="font-medium">{q.contactName}</div>
                {/* Mail and phone links: the point of this screen is to reply,
                    so make replying one tap rather than a copy-paste. */}
                <a
                  href={`mailto:${q.email}`}
                  className="block break-all text-sm text-accent hover:underline"
                >
                  {q.email}
                </a>
                <a
                  href={`tel:${q.phone}`}
                  className="block text-sm text-muted-foreground hover:text-foreground"
                >
                  {q.phone}
                </a>
              </td>

              <td className="max-w-sm px-4 py-3">
                {q.vendor && (
                  <Badge variant="accent" className="mb-1.5">
                    {q.vendor}
                  </Badge>
                )}
                <div className="text-sm">{q.products}</div>
                {(q.seats || q.term) && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    {[q.seats ? `${q.seats} хэрэглэгч` : null, q.term]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                )}
                {q.message && (
                  <div className="mt-2 border-l border-white/10 pl-3 text-sm text-muted-foreground">
                    {q.message}
                  </div>
                )}
              </td>

              <td className="px-4 py-3">
                <StatusSelect
                  action={setSoftwareQuoteStatus}
                  id={q.id}
                  value={q.status}
                  options={STATUS}
                />
              </td>

              <td className="px-4 py-3 text-muted-foreground">{formatDate(q.createdAt)}</td>

              <td className="px-4 py-3">
                <DeleteButton action={deleteSoftwareQuote} id={q.id} />
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
