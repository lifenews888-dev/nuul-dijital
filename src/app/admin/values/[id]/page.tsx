import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { ValueForm } from "@/components/admin/forms/value-form";

export const dynamic = "force-dynamic";

export default async function EditValuePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const value = await safe(() => db.value.findUnique({ where: { id } }), null);
  if (!value) notFound();
  return (
    <div>
      <AdminHeader title="Үнэт зүйл засах" />
      <ValueForm value={value} />
    </div>
  );
}
