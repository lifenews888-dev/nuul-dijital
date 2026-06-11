import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { ValueForm } from "@/components/admin/forms/value-form";

export const dynamic = "force-dynamic";

export default async function NewValuePage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ үнэт зүйл" />
      <ValueForm />
    </div>
  );
}
