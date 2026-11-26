import type { CoverInput } from "./cover";
import type { PostListItem } from "./posts";

/**
 * Мэдээг хавтасны оролт болгоно — ЦОРЫН ГАГЦ хөрвүүлэх газар.
 *
 * `cover.ts` дотор байж БОЛОХГҮЙ: `posts.ts` нь `cover.ts`-ээс `parseLook`-ийг
 * импортлодог тул эсрэг чиглэлийн импорт нь мөчлөг үүсгэнэ. Тиймээс хоёулангаас
 * нь уншдаг тусдаа модуль.
 */
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

/** Хавтасны кэшлэгдэх хаяг. `shelf-model.ts` ба картууд хоёул эндээс авна. */
export function coverUrl(slug: string): string {
  return `/cover/${encodeURIComponent(slug)}`;
}
