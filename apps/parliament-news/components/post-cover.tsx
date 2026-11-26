import { coverSvg, type CoverInput } from "../lib/cover";
import type { PostListItem } from "../lib/posts";

/** Мэдээг хавтасны оролт болгоно — ЦОРЫН ГАГЦ хөрвүүлэх газар */
export function toCoverInput(post: PostListItem): CoverInput {
  return {
    title: post.title,
    kicker: post.kicker,
    lead: post.lead,
    categoryName: post.categoryName,
    motif: post.motif,
    theme: post.theme,
    look: post.look,
    imageUrl: post.imageUrl,
    featured: post.featured,
    date: post.date,
  };
}

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
