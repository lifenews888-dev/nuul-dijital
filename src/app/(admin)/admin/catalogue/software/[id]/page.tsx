import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { SoftwareVendorForm } from "@/components/admin/forms/software-vendor-form";

export const dynamic = "force-dynamic";

export default async function EditSoftwareVendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const [vendor, categories] = await Promise.all([
    db.softwareVendor.findUnique({
      where: { id },
      include: { categories: { select: { slug: true } } },
    }),
    safe(
      () =>
        db.softwareCategory.findMany({
          orderBy: [{ group: "asc" }, { order: "asc" }],
          select: { slug: true, title: true, group: true },
        }),
      [] as { slug: string; title: string; group: string }[]
    ),
  ]);
  if (!vendor) notFound();

  return (
    <div>
      <AdminHeader title="Үйлдвэрлэгч засах" />
      <SoftwareVendorForm vendor={vendor} categories={categories} />
    </div>
  );
}
