import { safeImageSrc } from "./images";
import { safeLink } from "./live-input";

/**
 * Сурталчилгааны баннерын ЦЭВЭР дүрмүүд.
 *
 * Зар бол ХУГАЦААТАЙ, ТӨЛБӨРТЭЙ үүрэг: нэг өдөр эрт эсвэл оройтож гарах нь
 * захиалагчийн өмнөх алдаа. Тиймээс цонхны шалгалт нь уншилтын хэсэгт биш,
 * тестлэгдэх цэвэр функцэд байна.
 */

export type Placement = "home" | "article" | "side";
export type MediaKind = "image" | "video";

export type BannerRow = {
  id: string;
  imageUrl: string;
  kind: string;
  linkUrl: string | null;
  title: string | null;
  placement: string;
  startsOn: Date | null;
  endsOn: Date | null;
  order: number;
};

export type AdItem = {
  id: string;
  url: string;
  kind: MediaKind;
  link: string | null;
  title: string | null;
};

const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

/**
 * Файлын өргөтгөлөөс медиа төрөл. GIF нь ЗУРАГ: хөтөч өөрөө хөдөлгөдөг,
 * `<video>`-д хийвэл удирдлага, дуу гэх мэт хэрэггүй зүйл дагана.
 */
export function bannerKind(url: string): MediaKind {
  return VIDEO.test(url) ? "video" : "image";
}

/** `@db.Date` утгууд UTC шөнө дундаар ирдэг тул харьцуулалт мөн тэр хэмжээнд. */
function dayStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Artifact-ийн `adBlock()`-ийн шүүлт:
 *   яг таарсан байршил | `all` хаана ч | `both` нийтлэлээс БУСАД газар.
 */
function atPlace(placement: string, place: Placement): boolean {
  if (placement === place || placement === "all") return true;
  return placement === "both" && place !== "article";
}

export function visibleBanners(
  rows: BannerRow[],
  place: Placement,
  now: Date = new Date(),
): AdItem[] {
  const today = dayStart(now);
  const out: AdItem[] = [];

  for (const r of rows) {
    if (!atPlace(r.placement, place)) continue;
    if (r.startsOn && r.startsOn > now) continue;
    /** Дуусах өдөр нь БҮТЭН: тэр өдрийн 23:59 хүртэл зар гарна. */
    if (r.endsOn && r.endsOn < today) continue;

    const url = safeImageSrc(r.imageUrl);
    if (!url) continue;

    out.push({
      id: r.id,
      url,
      kind: r.kind === "video" || r.kind === "image" ? r.kind : bannerKind(url),
      /** Холбоос нь хүчингүй бол зар нь ХЭВЭЭР гарна, зүгээр л дарагдахгүй. */
      link: safeLink(r.linkUrl) ? (r.linkUrl as string) : null,
      title: r.title,
    });
  }

  return out;
}
