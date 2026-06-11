import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { ProjectForm } from "@/components/admin/forms/project-form";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const project = await safe(() => db.project.findUnique({ where: { id } }), null);
  if (!project) notFound();
  return (
    <div>
      <AdminHeader title="Төсөл засах" />
      <ProjectForm project={project} />
    </div>
  );
}
