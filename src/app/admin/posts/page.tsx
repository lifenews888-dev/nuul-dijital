import Link from "next/link";
import { Pencil } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { deletePost } from "@/app/admin/actions";
import { AdminHeader, EmptyState, TableShell, StatusBadge } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  await requireUser();
  const posts = await safe(
    () => db.post.findMany({ orderBy: { createdAt: "desc" } }),
    [] as Awaited<ReturnType<typeof db.post.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Нийтлэл" description="Блогийн нийтлэлүүдийг удирдах" newHref="/admin/posts/new" />
      {posts.length === 0 ? (
        <EmptyState message="Нийтлэл алга байна." />
      ) : (
        <TableShell head={["Гарчиг", "Ангилал", "Төлөв", "Огноо", ""]}>
          {posts.map((p) => (
            <tr key={p.id} className="hover:bg-white/[0.02]">
              <td className="px-4 py-3 font-medium">{p.title}</td>
              <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
              <td className="px-4 py-3">
                <StatusBadge status={p.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(p.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/admin/posts/${p.id}`}
                    className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    aria-label="Засах"
                  >
                    <Pencil className="size-4" />
                  </Link>
                  <DeleteButton action={deletePost} id={p.id} label={`"${p.title}" устгах уу?`} />
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      )}
    </div>
  );
}
