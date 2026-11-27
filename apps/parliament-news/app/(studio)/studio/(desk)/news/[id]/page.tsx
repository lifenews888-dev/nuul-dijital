import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireStudio } from "../../../../../../lib/studio-session";
import { studioPost, studioCategories } from "../../../../../../lib/studio-post";
import { ubToday } from "../../../../../../lib/format";
import { EditorForm } from "../../../../../../components/studio/editor/editor-form";

export const metadata: Metadata = { title: "Мэдээ засах" };

/**
 * Байгаа мэдээ. `requireStudio()` нь бүрхүүлд аль хэдийн дуудагдсан ч
 * ЭНД ДАХИН дуудна: Next нь бүрхүүл ба хуудсыг ЗЭРЭГ зурдаг тул
 * бүрхүүлийн `redirect()` нь хуудсын биеийг зогсоодоггүй.
 */
export default async function EditPostPage({ params }: { params: { id: string } }) {
  const { actor, tenantId } = await requireStudio();

  const [post, categories] = await Promise.all([
    studioPost(tenantId, params.id),
    studioCategories(tenantId),
  ]);

  if (!post) notFound();

  return (
    <EditorForm
      actor={actor}
      post={post}
      categories={categories}
      today={ubToday().toISOString().slice(0, 10)}
    />
  );
}
