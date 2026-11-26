/**
 * SEO-ийн цэвэр хэрэгслүүд: XML escape, бүтэн хаяг, meta тайлбар.
 * RSS, sitemap, generateMetadata, OG гурвуулан эднийг хуваалцана.
 */
import { excerpt } from "./format";

/** meta description-ийн хязгаар. Хайлтын систем ~155-160-ийг харуулдаг. */
export const META_MAX = 155;

/**
 * XML-ийн таван тэмдэгтийг entity болгоно.
 *
 * `&` нь ХАМГИЙН ЭХЭНД сольно — эс бөгөөс дараа үүсэх `&lt;`-ийн `&` нь
 * дахин сольж `&amp;lt;` болно.
 *
 * Оролт нь түүхий текст гэж үзнэ: хоёр удаа дуудвал буруу гарна, дуудагч
 * нэг л удаа дуудна.
 */
export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Замыг base-тэй залгаж бүтэн хаяг болгоно. Зураас давхардахгүй. */
export function absoluteUrl(path: string, base: string): string {
  const root = base.replace(/\/+$/, "");
  const rel = path.startsWith("/") ? path : "/" + path;
  return root + rel;
}

/** Мөр дамжилт, давхар зайг нэг зай болгоно — meta атрибутад мөр байж болохгүй. */
function collapse(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * meta description: lead байвал түүнээс, байхгүй бол биетээс.
 * Хоёулаа хоосон бол хоосон мөр — хуурамч тайлбар зохиохгүй.
 */
export function metaDescription(lead: string | null, body: string | null): string {
  const fromLead = collapse(lead ?? "");
  if (fromLead) return excerpt(fromLead, META_MAX);

  const fromBody = collapse(body ?? "");
  if (fromBody) return excerpt(fromBody, META_MAX);

  return "";
}
