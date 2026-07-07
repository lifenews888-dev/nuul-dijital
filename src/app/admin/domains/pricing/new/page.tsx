import { requirePermission } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { TldProductForm } from "@/components/admin/forms/tld-product-form";

export const dynamic = "force-dynamic";

export default async function NewTldProductPage() {
  await requirePermission("domains", "manage");

  return (
    <div>
      <AdminHeader title="Шинэ TLD нэмэх" description="Шинэ домэйн өргөтгөл болон үнийг тохируулна." />
      <TldProductForm />
    </div>
  );
}