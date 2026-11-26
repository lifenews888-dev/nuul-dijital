/**
 * Нийтлэлийн хуудасны цэвэр шийдвэрүүд.
 */

export type SlugTarget =
  | { kind: "render" }
  | { kind: "redirect"; to: string }
  | { kind: "notFound" };

/**
 * Гуйсан хаягийг юу хийхийг шийднэ.
 *
 * `found` нь гуйсан slug-аар ШУУД олдсон, эсвэл `NewsSlugRedirect`-ээр
 * олдсон мэдээний ОДООГИЙН slug.
 *
 * Чухал: гуйсан slug нь олдсон мэдээний одоогийн slug-тай тэнцвэл
 * рендерлэнэ, шилжүүлэхгүй. Slug нь хуучин утга руугаа буцсан үед
 * (A→B→A) хуудас өөр дээрээ шилжиж тэнцвэргүй цикл үүсэхээс сэргийлнэ.
 */
export function resolveSlugTarget(
  requested: string,
  found: { slug: string } | null,
): SlugTarget {
  if (!found) return { kind: "notFound" };
  if (found.slug === requested) return { kind: "render" };
  return { kind: "redirect", to: `/news/${found.slug}` };
}

/**
 * Биетийг догол мөрүүд болгоно: хоосон мөр нь заагч.
 *
 * Гаргалт нь ТЕКСТ. Дуудагч `dangerouslySetInnerHTML` хэрэглэхгүй: `body` нь
 * редакцаас ирэх өгөгдөл бөгөөд 3-р шатанд HTML болох магадлалтай. Тэр үед
 * sanitize хийх шийдвэрийг тусад нь, зориудаар гаргана — одоо чимээгүй
 * HTML зурж эхэлбэл тэр шийдвэр хийгдээгүйгээр өнгөрнө.
 */
export function paragraphs(body: string | null): string[] {
  if (!body) return [];
  return body
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}
