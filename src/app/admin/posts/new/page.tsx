import { requireUser } from "@/lib/admin";
import { AdminHeader } from "@/components/admin/ui";
import { PostForm } from "@/components/admin/forms/post-form";

export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  await requireUser();
  return (
    <div>
      <AdminHeader title="Шинэ нийтлэл" />
      <PostForm />
    </div>
  );
}
