import { coverUrl } from "../lib/cover-input";
import type { PostListItem } from "../lib/posts";

/**
 * Номын хавтас — кэшлэгдэх хаягаар.
 *
 * Inline SVG-гээр биш: нүүрэнд 8 хавтас шингэвэл HTML 128 KB болж, хэмжсэн
 * зорилт (100 KB; ikon.mn 59 KB) давна. Хаягаар үйлчилбэл CDN-д кэшлэгдэж,
 * хуудас хооронд дахин татагдахгүй. Нийтлэлийн хуудас мөн үүнийг хэрэглэнэ
 * (баруун талын галерейн эхний слайд) — тэр ч бас кэшээс ирнэ.
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
