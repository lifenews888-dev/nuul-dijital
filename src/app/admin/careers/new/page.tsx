import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { JobForm } from "@/components/admin/forms/job-form";

export const dynamic = "force-dynamic";

export default async function NewJobPage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ ажлын байр" />
      <JobForm />
    </div>
  );
}
