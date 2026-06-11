import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { ProcessForm } from "@/components/admin/forms/process-form";

export const dynamic = "force-dynamic";

export default async function EditProcessPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const step = await safe(() => db.processStep.findUnique({ where: { id } }), null);
  if (!step) notFound();
  return (
    <div>
      <AdminHeader title="Алхам засах" />
      <ProcessForm step={step} />
    </div>
  );
}
