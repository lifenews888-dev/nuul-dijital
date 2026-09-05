import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { SoftwareCategoryForm } from "@/components/admin/forms/software-category-form";

export const dynamic = "force-dynamic";

export default async function NewSoftwareCategoryPage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ ангилал" />
      <SoftwareCategoryForm />
    </div>
  );
}
