/**
 * Самбарын графикийн цэвэр тооцоо.
 *
 * Компонентод шууд бичвэл тест хүрэхгүй: хоосон өдөр алга болох, цагийн
 * бүсээр нэг өдөр гулсах, бүх утга тэг үед тэгд хуваагдах — бүгд энд.
 */

/** Улаанбаатар нь UTC+8 — сервер UTC дээр ажиллана */
const UB_OFFSET_MS = 8 * 3_600_000;
const DAY_MS = 86_400_000;

export const CHART_RANGES = [
  { days: 14, label: "14 хоног" },
  { days: 30, label: "30 хоног" },
  { days: 90, label: "90 хоног" },
] as const;

export type ChartDays = (typeof CHART_RANGES)[number]["days"];

export type ActivityPoint = { action: string; createdAt: Date };
export type ChartPoint = { day: string; published: number; other: number };

/** Хугацааг УБ-ын өдрийн түлхүүр болгоно: `2026-11-27` */
function ubDayKey(at: Date): string {
  return new Date(at.getTime() + UB_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Сүүлийн `days` хоногийн түлхүүрүүд, өнөөдрөөр төгссөн.
 *
 * Хоосон өдрийг ХАСАХГҮЙ: график нь завсаргүй байх ёстой, эс бөгөөс
 * ажилласан өдрүүд зэрэгцэж, амралт байгаагүй мэт харагдана.
 */
export function dayKeys(days: number, now: Date = new Date()): string[] {
  const end = new Date(now.getTime() + UB_OFFSET_MS);
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    out.push(new Date(end.getTime() - i * DAY_MS).toISOString().slice(0, 10));
  }
  return out;
}

export function bucketActivity(
  rows: ActivityPoint[],
  days: number,
  now: Date = new Date(),
): ChartPoint[] {
  const keys = dayKeys(days, now);
  const index = new Map(keys.map((day, i) => [day, i]));
  const points: ChartPoint[] = keys.map((day) => ({ day, published: 0, other: 0 }));

  for (const row of rows) {
    const i = index.get(ubDayKey(row.createdAt));
    if (i === undefined) continue;
    if (row.action === "publish") points[i].published += 1;
    else points[i].other += 1;
  }

  return points;
}

/** Тэнхлэгийн дээд утга. Бүгд тэг үед ч 0-д ХУВААХГҮЙ. */
export function chartMax(points: ChartPoint[]): number {
  return Math.max(1, ...points.map((p) => p.published + p.other));
}

/** УБ-ын цагаар мэндчилгээ */
export function greeting(hour: number): string {
  if (hour >= 5 && hour < 11) return "Өглөөний мэнд";
  if (hour >= 11 && hour < 18) return "Өдрийн мэнд";
  if (hour >= 18 && hour < 23) return "Оройн мэнд";
  return "Сайн байна уу";
}
