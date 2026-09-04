import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { TestimonialForm } from "@/components/admin/forms/testimonial-form";

export const dynamic = "force-dynamic";

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const testimonial = await safe(() => db.testimonial.findUnique({ where: { id } }), null);
  if (!testimonial) notFound();
  return (
    <div>
      <AdminHeader title="Сэтгэгдэл засах" />
      <TestimonialForm testimonial={testimonial} />
    </div>
  );
}
