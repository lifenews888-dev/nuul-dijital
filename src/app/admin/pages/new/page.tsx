import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { PageForm } from "@/components/admin/forms/page-form";

export const dynamic = "force-dynamic";

export default async function NewPagePage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ хуудас" />
      <PageForm />
    </div>
  );
}
