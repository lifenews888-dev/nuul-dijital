import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { CaseStudyForm } from "@/components/admin/forms/case-study-form";

export const dynamic = "force-dynamic";

export default async function EditCaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const caseStudy = await safe(() => db.caseStudy.findUnique({ where: { id } }), null);
  if (!caseStudy) notFound();
  return (
    <div>
      <AdminHeader title="Кейс судалгаа засах" />
      <CaseStudyForm caseStudy={caseStudy} />
    </div>
  );
}
