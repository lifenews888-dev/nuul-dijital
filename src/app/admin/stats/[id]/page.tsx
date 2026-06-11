import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { StatForm } from "@/components/admin/forms/stat-form";

export const dynamic = "force-dynamic";

export default async function EditStatPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const stat = await safe(() => db.stat.findUnique({ where: { id } }), null);
  if (!stat) notFound();
  return (
    <div>
      <AdminHeader title="Статистик засах" />
      <StatForm stat={stat} />
    </div>
  );
}
