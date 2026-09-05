import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { SoftwareCategoryForm } from "@/components/admin/forms/software-category-form";

export const dynamic = "force-dynamic";

export default async function EditSoftwareCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const category = await db.softwareCategory.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <div>
      <AdminHeader title="Ангилал засах" />
      <SoftwareCategoryForm category={category} />
    </div>
  );
}
