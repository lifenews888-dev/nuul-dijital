import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { StatForm } from "@/components/admin/forms/stat-form";

export const dynamic = "force-dynamic";

export default async function NewStatPage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ статистик" />
      <StatForm />
    </div>
  );
}
