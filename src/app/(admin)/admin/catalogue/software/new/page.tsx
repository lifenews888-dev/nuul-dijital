import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { SoftwareVendorForm } from "@/components/admin/forms/software-vendor-form";

export const dynamic = "force-dynamic";

export default async function NewSoftwareVendorPage() {
  await requireUser();
  const categories = await safe(
    () =>
      db.softwareCategory.findMany({
        orderBy: [{ group: "asc" }, { order: "asc" }],
        select: { slug: true, title: true, group: true },
      }),
    [] as { slug: string; title: string; group: string }[]
  );

  return (
    <div>
      <AdminHeader title="Шинэ үйлдвэрлэгч" />
      <SoftwareVendorForm categories={categories} />
    </div>
  );
}
