import { coverSvg } from "../lib/cover";
import { toCoverInput, coverUrl } from "../lib/cover-input";
import type { PostListItem } from "../lib/posts";

/**
 * Номын хавтас inline SVG-гээр.
 *
 * `dangerouslySetInnerHTML` нь энд аюулгүй: тэмдэгт мөрийг бид өөрсдөө
 * `lib/cover.ts`-д үүсгэж, хэрэглэгчийн оруулсан бүх утгыг `xmlEscape`-ээр
 * дамжуулдаг, өнгө нь 6 оронтой hex эсэхээр шалгагддаг, зургийн хаяг нь
 * escape хийгддэг. Энэ нь `ArticleBody`-гийн хадгалсан HTML-ээс өөр асуудал:
 * тэнд эх сурвалж нь редакцын өгөгдөл, энд бидний үүсгэсэн markup.
 */
export function PostCover({
  post,
  className,
}: {
  post: PostListItem;
  className?: string;
}) {
  return (
    <div
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: coverSvg(toCoverInput(post)) }}
    />
  );
}

/**
 * Хавтас кэшлэгдэх хаягаар.
 *
 * Жагсаалтад ҮҮНИЙГ хэрэглэнэ, `PostCover`-ийг биш: нүүрэнд 8 хавтас шингэвэл
 * HTML 128 KB болж, хэмжсэн зорилт (100 KB; ikon.mn 59 KB) давна. Нийтлэлийн
 * хуудсанд ганц хавтас inline байх нь зөв — тэр нь LCP элемент, нэмэлт
 * хүсэлт хийлгэхгүй.
 */
export function PostCoverImage({
  post,
  className,
}: {
  post: PostListItem;
  className?: string;
}) {
  return (
    <img
      src={coverUrl(post.slug)}
      alt=""
      width={474}
      height={900}
      loading="lazy"
      decoding="async"
      className={className}
    />
  );
}
