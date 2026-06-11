import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { JobForm } from "@/components/admin/forms/job-form";

export const dynamic = "force-dynamic";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const job = await safe(() => db.job.findUnique({ where: { id } }), null);
  if (!job) notFound();
  return (
    <div>
      <AdminHeader title="Ажлын байр засах" />
      <JobForm job={job} />
    </div>
  );
}
