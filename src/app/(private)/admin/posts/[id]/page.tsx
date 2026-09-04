import Link from "next/link";
import { notFound } from "next/navigation";
import { History } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { PostForm } from "@/components/admin/forms/post-form";

export const dynamic = "force-dynamic";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const post = await safe(() => db.post.findUnique({ where: { id } }), null);
  if (!post) notFound();

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <AdminHeader title="Нийтлэл засах" />
      </div>
      <Link
        href={`/admin/posts/${id}/revisions`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
      >
        <History className="size-4" /> Хувилбарын түүх
      </Link>
      <PostForm post={post} />
    </div>
  );
}
