import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { PageForm } from "@/components/admin/forms/page-form";

export const dynamic = "force-dynamic";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const page = await safe(() => db.page.findUnique({ where: { id } }), null);
  if (!page) notFound();
  return (
    <div>
      <AdminHeader title="Хуудас засах" />
      <PageForm page={page} />
    </div>
  );
}
