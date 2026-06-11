import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { listRevisions } from "@/lib/revisions";
import { restoreRevision } from "@/app/admin/actions";
import { AdminHeader, EmptyState } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PostRevisionsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const post = await safe(() => db.post.findUnique({ where: { id } }), null);
  if (!post) notFound();
  const revisions = await listRevisions("Post", id);

  return (
    <div>
      <AdminHeader title={`Хувилбарын түүх — ${post.title}`} description="Өмнөх хувилбарыг сэргээх боломжтой" />
      <Link
        href={`/admin/posts/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
      >
        <ArrowLeft className="size-4" /> Засварлах руу буцах
      </Link>

      {revisions.length === 0 ? (
        <EmptyState message="Хувилбар хадгалагдаагүй байна." />
      ) : (
        <ul className="flex flex-col gap-3">
          {revisions.map((r) => {
            const data = r.data as { title?: string; status?: string };
            return (
              <li
                key={r.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-card p-5"
              >
                <div>
                  <div className="font-medium">
                    Хувилбар #{r.version}{" "}
                    <span className="text-sm text-muted-foreground">— {data.title ?? "—"}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.authorEmail ?? "—"} · {formatDate(r.createdAt)} · {data.status ?? ""}
                  </div>
                </div>
                <form action={restoreRevision}>
                  <input type="hidden" name="revisionId" value={r.id} />
                  <Button type="submit" variant="outline" size="sm">
                    <RotateCcw className="size-4" /> Сэргээх
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
