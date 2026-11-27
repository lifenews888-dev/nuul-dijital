import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireStudio } from "../../../../../../lib/studio-session";
import { studioCategories } from "../../../../../../lib/studio-post";
import { canCreate } from "../../../../../../lib/permissions";
import { ubToday } from "../../../../../../lib/format";
import { EditorForm } from "../../../../../../components/studio/editor/editor-form";

export const metadata: Metadata = { title: "Шинэ мэдээ" };

/**
 * Шинэ мэдээ. Үүсгэх эрхгүй хүнийг жагсаалт руу буцаана — 403 хуудас
 * үзүүлэхээс дээр: тэр хүн зүгээр л буруу холбоос дарсан байна.
 */
export default async function NewPostPage() {
  const { actor, tenantId } = await requireStudio();
  if (!canCreate(actor)) redirect("/studio/news");

  const categories = await studioCategories(tenantId);

  return (
    <EditorForm
      actor={actor}
      post={null}
      categories={categories}
      today={ubToday().toISOString().slice(0, 10)}
    />
  );
}
