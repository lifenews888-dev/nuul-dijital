import { paragraphs } from "../lib/article";

/**
 * Мэдээний биет.
 *
 * `dangerouslySetInnerHTML` ЗОРИУД хэрэглэхгүй: `body` нь редакцаас ирэх
 * өгөгдөл бөгөөд 3-р шатанд (Tiptap) HTML болох магадлалтай. Тэр үед sanitize
 * хийх шийдвэрийг тусад нь, зориудаар гаргана — одоо чимээгүй HTML зурж
 * эхэлбэл тэр шийдвэр хийгдээгүйгээр өнгөрнө.
 */
export function ArticleBody({ body }: { body: string | null }) {
  const blocks = paragraphs(body);
  if (blocks.length === 0) return null;

  return (
    <div className="mt-6 space-y-4 text-[1.0625rem] leading-[1.75]">
      {/* Догол мөр нь дахин эрэмбэлэгддэггүй тул индекс нь тогтвортой түлхүүр */}
      {blocks.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}
