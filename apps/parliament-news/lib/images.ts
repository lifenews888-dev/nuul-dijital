/**
 * Зургийн шугам — `next/image`-ийн хүрээнд.
 *
 * Яагаад энэ нь чухал вэ: 2026-11-26-нд хэмжихэд Монголын гурван том мэдээний
 * сайт нийтлэлийн гол зургийг 296 KB (ikon.mn), 335 KB (gogo.mn), 466 KB
 * (news.mn) JPEG-ээр үйлчилж, `Accept: image/webp` гуйсан ч JPEG буцааж,
 * `Vary: Accept` header ч тавьдаггүй. `next/image` нь WebP/AVIF-ийн content
 * negotiation ба responsive `srcset`-ийг автоматаар хийдэг тул 3-4 дахин
 * жижиг зураг нь сонгосон framework-ээс үнэгүй ирнэ.
 * Хэмжилт: `docs/superpowers/specs/2026-11-26-mn-news-benchmark.md`
 */
import { COVER_W, COVER_H } from "./cover";
import { ALLOWED_HOST_SUFFIXES } from "./image-hosts";

export type ImageVariant = "hero" | "card" | "shelf";

/**
 * Зургийн байрны харьцаа. `shelf` нь хавтасны даавуутай ЯГ адил байх ёстой
 * тул тоог давтахгүй, cover.ts-ээс авна.
 */
const DIMS: Record<ImageVariant, { width: number; height: number }> = {
  hero: { width: 1600, height: 900 },
  card: { width: 1200, height: 800 },
  shelf: { width: COVER_W, height: COVER_H },
};

/**
 * Хөтчид «энэ зураг ямар өргөнтэй зурагдах вэ» гэж хэлнэ. Үүнгүй бол
 * `next/image` хамгийн том хувилбарыг татаж, мобайлд дэмий урсгал зарцуулна.
 */
const SIZES: Record<ImageVariant, string> = {
  hero: "(max-width: 768px) 100vw, 800px",
  card: "(max-width: 768px) 100vw, 33vw",
  shelf: "(max-width: 768px) 60vw, 240px",
};

export function imageDims(variant: ImageVariant): { width: number; height: number } {
  return DIMS[variant];
}

export function imageSizes(variant: ImageVariant): string {
  return SIZES[variant];
}

/**
 * `next/image` үйлчилж чадах эх хаяг эсэхийг шалгана. Чадахгүй бол null —
 * дуудагч тэр үед эвдэрсэн зураг биш, хавтасны SVG-г зурна.
 *
 * Зөвшөөрөх нь ЗӨВХӨН: `/`-ээр эхэлсэн дотоод зам (`..`-гүй), эсвэл
 * `image-hosts.js`-ийн жагсаалтад байгаа host руу чиглэсэн https хаяг.
 */
export function safeImageSrc(url: string | null | undefined): string | null {
  const src = (url ?? "").trim();
  if (!src) return null;

  // Дотоод зам. `//` нь протоколгүй гадаад хаяг тул энд орохгүй.
  if (src.startsWith("/")) {
    if (src.startsWith("//")) return null;
    if (src.includes("..")) return null;
    return src;
  }

  let parsed: URL;
  try {
    parsed = new URL(src);
  } catch {
    return null;
  }

  if (parsed.protocol !== "https:") return null;
  const host = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host.endsWith(suffix) && host.length > suffix.length,
  );
  return allowed ? src : null;
}
