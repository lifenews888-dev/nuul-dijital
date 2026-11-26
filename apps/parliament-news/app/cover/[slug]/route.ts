import { postBySlug } from "../../../lib/posts";
import { coverSvg } from "../../../lib/cover";
import { toCoverInput } from "../../../lib/cover-input";

/**
 * Номын хавтасны SVG-г кэшлэгдэх файл болгож үйлчилнэ.
 *
 * Яагаад inline биш гэдгийг `components/shelf-model.ts`-д бичсэн: нүүрэнд
 * 12 хавтас шингэвэл client component-ийн props нь HTML-д ба RSC payload-д
 * хоёр удаа цувруулагдаж ~84 KB болно. Хаягаар үйлчилбэл HTML жижиг үлдэж,
 * хавтас нь CDN-д кэшлэгдэнэ.
 *
 * Нийтлэгдээгүй мэдээний хавтас ч 404 — `postBySlug` нь нийтийн хаалгаар
 * дамждаг тул ноорогийн гарчиг зургаар ч гоожихгүй.
 */
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const post = await postBySlug(params.slug);
  if (!post) {
    return new Response("Мэдээ олдсонгүй", { status: 404 });
  }

  return new Response(coverSvg(toCoverInput(post)), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
