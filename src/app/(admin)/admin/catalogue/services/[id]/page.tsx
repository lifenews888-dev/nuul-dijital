import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { ServiceForm } from "@/components/admin/forms/service-form";

export const dynamic = "force-dynamic";

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const service = await db.service.findUnique({ where: { id } });
  if (!service) notFound();

  return (
    <div>
      <AdminHeader title="Үйлчилгээ засах" />
      <ServiceForm service={service} />
    </div>
  );
}
