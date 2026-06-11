import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { CaseStudyForm } from "@/components/admin/forms/case-study-form";

export const dynamic = "force-dynamic";

export default async function NewCaseStudyPage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ кейс судалгаа" />
      <CaseStudyForm />
    </div>
  );
}
