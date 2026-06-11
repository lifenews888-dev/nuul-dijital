import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { ProjectForm } from "@/components/admin/forms/project-form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ төсөл" />
      <ProjectForm />
    </div>
  );
}
