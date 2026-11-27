/**
 * Унших харагдацын цэвэр логик — `site-v2/index.html`-ийн нийтлэлийн дэлгэц.
 *
 * DOM-гүй, Prisma-гүй: тул сервер дээрх бүрэлдэхүүн ч, хөтөч дэх
 * client component ч нэг л дүрэм хуваалцана.
 */
import { BILL_STAGES } from "./bill-stages";

/** Artifact-ийн `setFz`: .85 – 1.4, .1 алхамтай */
export const FZ_MIN = 0.85;
export const FZ_MAX = 1.4;
export const FZ_STEP = 0.1;

/**
 * Хөвөгч тоон алдааг таслана: `1.1 + 0.1` нь 1.2000000000000002 өгдөг ба
 * түүнийг `localStorage`-д бичвэл дараагийн ачаалалт мөн адил хачин утгаар
 * эхэлнэ. Artifact нь `Math.round(v*100)/100` хэрэглэдэг, мөн адил.
 */
export function clampFz(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(FZ_MIN, Math.min(FZ_MAX, Math.round(value * 100) / 100));
}

/** Нийгмийн сүлжээний хуваалцах хаягууд. Artifact-ийн `setShare`. */
export function shareLinks(
  url: string,
  title: string,
): { facebook: string; x: string; telegram: string } {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
    x: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
  };
}

export type RelatedFacts = {
  categorySlug: string | null;
  hasBill: boolean;
  featured: boolean;
  date: Date;
};

const YEAR_SCALE = 86_400_000 * 400;

/**
 * Artifact-ийн `sc()`: ижил ангилал 3, хоёулаа хуулийн төсөлтэй 1, онцлох 1,
 * хасах нь огнооны зай. Ангилалгүй хоёр мэдээ нь ижил ангилал БИШ — `null`
 * нь "ангилал байхгүй", "ижил ангилал" биш.
 */
export function relatedScore(current: RelatedFacts, other: RelatedFacts, now: Date): number {
  const sameCategory =
    current.categorySlug !== null && current.categorySlug === other.categorySlug;
  return (
    (sameCategory ? 3 : 0) +
    (current.hasBill && other.hasBill ? 1 : 0) +
    (other.featured ? 1 : 0) -
    Math.abs(now.getTime() - other.date.getTime()) / YEAR_SCALE
  );
}

/** Artifact-ийн `ago()`: сая / мин / цаг / огноо */
export function commentAgo(at: Date, now: Date = new Date()): string {
  const minutes = Math.round((now.getTime() - at.getTime()) / 60_000);
  if (minutes < 1) return "дөнгөж сая";
  if (minutes < 60) return `${minutes} мин өмнө`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} цагийн өмнө`;
  return at.toISOString().slice(0, 10).replace(/-/g, ".");
}

export type StageState = "Дууссан" | "Одоогийн шат" | "Хүлээгдэж буй";

export function stageState(index: number, current: number): StageState {
  if (index < current) return "Дууссан";
  if (index === current) return "Одоогийн шат";
  return "Хүлээгдэж буй";
}

/**
 * Шатны тайлбар. Хоосон байх нь хоёр ӨӨР утгатай: ирээдүйн шат бол хараахан
 * болоогүй, өнгөрсөн шат бол болсон ч редакц бичээгүй. Хоёуланд нь нэг үг
 * бичвэл уншигч "мэдээлэл алга" гэж ойлгоод, үнэндээ шат нь болоогүй.
 */
export function stageNote(index: number, current: number, note: string | null): string {
  if (note && note.trim()) return note;
  return index > current
    ? "Энэ шат хараахан эхлээгүй байна."
    : "Энэ шатны дэлгэрэнгүй мэдээлэл хараахан ороогүй байна.";
}

/** Санал хураалтын хуваарилалт. Санал байхгүйд 0-д хуваахаас сэргийлнэ. */
export function voteShare(
  yes: number,
  no: number,
): { yesPct: number; noPct: number; support: number } {
  const total = yes + no;
  if (total <= 0) return { yesPct: 0, noPct: 0, support: 0 };
  return {
    yesPct: (yes / total) * 100,
    noPct: (no / total) * 100,
    support: Math.round((yes / total) * 100),
  };
}

/** Номын хуудасны толгой: artifact-ийн `dH` */
export function runningHeader(categoryName: string): string {
  return `PARLIAMENT NEWS · ${categoryName.toUpperCase()}`;
}

export { BILL_STAGES };
