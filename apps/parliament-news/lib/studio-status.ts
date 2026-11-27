import type { NewsStatus } from "@nuul/db-news";

/**
 * Төлөвийн харагдах хэлбэр — `admin.html:840`-ийн `STS` ба `.pill.*`.
 *
 * Шошго, өнгө нь өгөгдлийн сангаас салангид: `NewsStatus` нь кодын үг,
 * эдгээр нь редакцын үг. Хоёрыг хольвол монгол текст query-д орж,
 * нэрийг засахад өгөгдлийн сан хөдлөнө.
 */

/** admin.html-ийн `STS` */
export const STATUS_LABELS: Record<NewsStatus, string> = {
  DRAFT: "Ноорог",
  REVIEW: "Хянагдаж буй",
  APPROVED: "Батлагдсан",
  RETURNED: "Буцаасан",
  PUBLISHED: "Нийтлэгдсэн",
};

/** Шүүлтүүрийн чипүүдийн дараалал — урсгалаар, «Буцаасан» нь хажуугийн сум */
export const STATUS_ORDER: NewsStatus[] = [
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "PUBLISHED",
  "RETURNED",
];

const MINUTE = 60_000;

/**
 * admin.html-ийн `ago()`.
 *
 * Ирээдүйн огноонд «−3 мин өмнө» гэж бичихгүй: сервер, хөтөч, өгөгдлийн
 * сангийн цаг хэдэн секундээр зөрөхөд ийм мөр үргэлж гардаг.
 */
export function mnAgoShort(at: Date, now: Date = new Date()): string {
  const minutes = Math.round(Math.max(0, now.getTime() - at.getTime()) / MINUTE);

  if (minutes < 1) return "дөнгөж сая";
  if (minutes < 60) return `${minutes} мин өмнө`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} цагийн өмнө`;
  return `${Math.round(minutes / 1440)} өдрийн өмнө`;
}
