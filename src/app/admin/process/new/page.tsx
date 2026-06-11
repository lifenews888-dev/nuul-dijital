import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { ProcessForm } from "@/components/admin/forms/process-form";

export const dynamic = "force-dynamic";

export default async function NewProcessPage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ алхам" />
      <ProcessForm />
    </div>
  );
}
