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

/** `postBadge`-ийн буцаах төрөл. `SCHEDULED` нь төлөв БИШ — харагдах байдал. */
export type PostBadge = { kind: NewsStatus | "SCHEDULED"; label: string };

/**
 * Жагсаалтын шошго — «САЙТАД БАЙГАА ЭСЭХ», зөвхөн өгөгдлийн сангийн
 * төлөв биш.
 *
 * Нийтийн шүүлт нь `status = PUBLISHED AND publishedAt <= now`
 * (`lib/posts.ts`-ийн `publishedWhere`). Иймд ирээдүйн огноотой мэдээ
 * нь төлөвөөрөө «Нийтлэгдсэн» атлаа уншигчид ХАРАГДАХГҮЙ. Шошго нь
 * «Нийтлэгдсэн» гэж хэлбэл редактор мэдээгээ гарсан гэж бодно.
 *
 * Огноогүй «нийтлэгдсэн» мэдээ ч мөн адил харагдахгүй (`not: null`) —
 * түүнийг ч «Цаг товлосон» гэж тэмдэглэнэ: хоёулаа «хүлээж байна»
 * гэсэн нэг утгатай, редакторт хийх зүйл нь ч адил.
 */
export function postBadge(
  post: { status: NewsStatus; publishedAt: Date | null },
  now: Date = new Date(),
): PostBadge {
  if (post.status !== "PUBLISHED") {
    return { kind: post.status, label: STATUS_LABELS[post.status] };
  }

  const live = post.publishedAt !== null && post.publishedAt.getTime() <= now.getTime();
  return live
    ? { kind: "PUBLISHED", label: STATUS_LABELS.PUBLISHED }
    : { kind: "SCHEDULED", label: "Цаг товлосон" };
}
