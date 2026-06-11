import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deleteTestimonial } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  await requireUser();
  const items = await safe(
    () => db.testimonial.findMany({ orderBy: { order: "asc" } }),
    [] as Awaited<ReturnType<typeof db.testimonial.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Сэтгэгдэл" description="Үйлчлүүлэгчдийн сэтгэгдэл" newHref="/admin/testimonials/new" />
      {items.length === 0 ? (
        <EmptyState message="Сэтгэгдэл алга байна." />
      ) : (
        <TableShell head={["Зохиогч", "Байгууллага", "Үнэлгээ", ""]}>
          {items.map((t) => (
            <tr key={t.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-medium">{t.author}</td>
              <td className="px-4 py-3 text-muted-foreground">{t.company}</td>
              <td className="px-4 py-3 text-accent-cyan">{"★".repeat(t.rating)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/testimonials/${t.id}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <DeleteButton action={deleteTestimonial} id={t.id} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
