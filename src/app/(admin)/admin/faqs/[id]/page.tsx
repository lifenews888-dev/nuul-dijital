import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { FaqForm } from "@/components/admin/forms/faq-form";

export const dynamic = "force-dynamic";

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const faq = await safe(() => db.faq.findUnique({ where: { id } }), null);
  if (!faq) notFound();
  return (
    <div>
      <AdminHeader title="FAQ засах" />
      <FaqForm faq={faq} />
    </div>
  );
}
