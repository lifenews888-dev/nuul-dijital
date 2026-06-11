import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { TestimonialForm } from "@/components/admin/forms/testimonial-form";

export const dynamic = "force-dynamic";

export default async function NewTestimonialPage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ сэтгэгдэл" />
      <TestimonialForm />
    </div>
  );
}
