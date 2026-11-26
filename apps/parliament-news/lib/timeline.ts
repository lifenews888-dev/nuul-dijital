/**
 * Нүүрний доод талын жилийн цагийн шугам — цэвэр тооцоо.
 *
 * Artifact-ийн `buildTl()` нь 53 долоо хоногийн нарийн зураас, 12 сарын
 * бүдүүн зураас ба шошго, мэдээ бүрт нэг цэг зурдаг. Байрлал бүр нь оны
 * хэдэн хувь өнгөрсөн гэдгээр тодорхойлогдоно.
 */

/** Artifact-ийн `MN` */
export const MONTH_LABELS = [
  "1-р сар",
  "2-р сар",
  "3-р сар",
  "4-р сар",
  "5-р сар",
  "6-р сар",
  "7-р сар",
  "8-р сар",
  "9-р сар",
  "10-р сар",
  "11-р сар",
  "12-р сар",
] as const;

/** Нарийн зураасны тоо: 0-оос 52 хүртэл */
export const WEEK_TICKS = 52;

const DAY = 86_400_000;

/**
 * Огноо нь өөрийн онын хэдэн хувьд байгаа (0..1).
 *
 * Огноо нь `@db.Date` тул UTC-ээр уншина — локал бүсээр уншвал жилийн хил
 * дээрх мэдээ нөгөө жилийн төгсгөлд үсэрч очно. Өндөр жилийг мөн тооцно:
 * хуваагч нь тэр оны бодит өдрийн тоо.
 */
export function yearFraction(d: Date): number {
  const year = d.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  const f = (d.getTime() - start) / (end - start);
  return Math.min(1, Math.max(0, f));
}

/** Сарын эхний өдрийн байрлалууд (0..1), шошготой нь хамт */
export function monthMarks(year: number): { label: string; fraction: number }[] {
  return MONTH_LABELS.map((label, i) => ({
    label,
    fraction: yearFraction(new Date(Date.UTC(year, i, 1))),
  }));
}

/**
 * Цэг нь энэ зайнаас хол бол амрахгүй, шууд үсэрнэ.
 *
 * Artifact-ийн frame() (index.html:811). Тойрог хаагдахад (сүүлийн номоос
 * эхнийх руу) огноо нь оны нэг хязгаараас нөгөө рүү харайдаг — амруулбал
 * цэг бүхэл шугамыг хөндлөн гүйж, мэдээг дагахаа болино.
 */
export const DOT_JUMP = 0.17;

/** Цэгийн амрах хурд (1/сек) — artifact-ийн `exp(-14*dt)` */
const DOT_K = 14;

/**
 * Тавиурын бутархай байрлал `s`-д харгалзах цэгийн зорилтот байрлал.
 *
 * Хоёр номын хооронд огноо нь шугаман дүүрнэ. Харин сүүлийн номоос эхнийх
 * руу (тойрог хаагдах зай) дүүргэхгүй — хагасаас хойш хамгийн ойрынх руу
 * үсэрнэ, өөрөөр бол цэг 12 сараас 1 сар хүртэл хөндлөн гүйнэ.
 */
export function dotTarget(fractions: number[], s: number): number {
  const n = fractions.length;
  if (n === 0) return 0;
  const fl = Math.floor(s);
  const i0 = ((fl % n) + n) % n;
  const i1 = (i0 + 1) % n;
  const f = s - fl;
  if (i0 === n - 1) return f < 0.5 ? fractions[i0] : fractions[i1];
  return fractions[i0] + (fractions[i1] - fractions[i0]) * f;
}

/** Цэгийн нэг кадрын хөдөлгөөн */
export function dotStep(current: number, target: number, dt: number): number {
  if (Math.abs(target - current) > DOT_JUMP) return target;
  return current + (target - current) * (1 - Math.exp(-DOT_K * dt));
}

/** Байрлалд (0..1) хамгийн ойр мэдээний индекс */
export function nearestIndex(fractions: number[], f: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < fractions.length; i++) {
    const d = Math.abs(fractions[i] - f);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/**
 * `from`-оос `to` хүрэх алхам, тойргийн БОГИНО замаар.
 *
 * Artifact-д `if(df>6)df-=L` — 12 мэдээтэй үеийн хагас. Мэдээний тоо
 * хувьсах тул хагасаар ерөнхийлсөн: n=12 үед яг тэнцүү.
 */
export function shortestStep(from: number, to: number, n: number): number {
  if (n <= 0) return 0;
  const d = (((to - from) % n) + n) % n;
  return d > n / 2 ? d - n : d;
}
