/**
 * Стори зурвасын эрэмбэ — artifact-ийн `buildStories()` (index.html).
 *
 * Эх жагсаалт нь ШИНЭ эхнийхээр ирнэ. Artifact нь түүнийг эргүүлээд
 * (хуучнаас шинэ рүү — Instagram-ийн зурвасын дараалал), онцлохыг нь
 * түрүүлүүлж, зургааг авдаг.
 */
export const STORY_MAX = 6;

export function orderStories<T extends { featured: boolean }>(posts: T[]): T[] {
  return posts
    .slice()
    .reverse()
    // `sort` нь тогтвортой (ES2019+) тул онцлохуудын дотоод дараалал хэвээр
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, STORY_MAX);
}
