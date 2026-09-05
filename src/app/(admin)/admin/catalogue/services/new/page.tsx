import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { ServiceForm } from "@/components/admin/forms/service-form";

export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ үйлчилгээ" />
      <ServiceForm />
    </div>
  );
}
