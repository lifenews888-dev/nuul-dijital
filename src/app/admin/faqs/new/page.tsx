import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { FaqForm } from "@/components/admin/forms/faq-form";

export const dynamic = "force-dynamic";

export default async function NewFaqPage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ FAQ" />
      <FaqForm />
    </div>
  );
}
