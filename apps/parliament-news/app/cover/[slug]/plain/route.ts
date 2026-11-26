import { postBySlug } from "../../../../lib/posts";
import { coverSvg } from "../../../../lib/cover";
import { toCoverInput } from "../../../../lib/cover-input";

/**
 * Текстгүй хавтас — зөвхөн дэвсгэр ба хээ.
 *
 * Сторины давхарга нь гарчиг, ангилал, огноог өөрөө дээр нь хэвлэдэг тул
 * дэвсгэрт бүтэн хавтас тавибал гарчиг хоёр удаа, зөрж харагдана.
 *
 * `../route.ts`-тэй ижил хаалга: `postBySlug` нь нийтийн уншилтаар дамждаг
 * тул ноорогийн хавтас ч 404.
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

  return new Response(coverSvg({ ...toCoverInput(post), plain: true }), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}
