/**
 * Монгол хэлний форматлагчид. Цэвэр функцууд — DB, React шаардахгүй.
 *
 * Цагийн бүсийн ХОЁР өөр дүрэм, зориуд:
 *
 * - `mnDate`, `mnShortDate` нь ОГНОО (`NewsPost.date`, Prisma-ийн `@db.Date`)
 *   дүрсэлнэ. Prisma түүнийг UTC шөнө дундаар буцаадаг тул UTC getter-ээр
 *   уншина. Local getter хэрэглэвэл UTC-ээс барууны машин (CI, өөр бүсийн
 *   хөгжүүлэгч) дээр өдөр нь нэгээр хоцорно.
 *
 * - `mnDateTime` нь бодит ХОРОМ (`publishedAt`) дүрсэлнэ. Уншигч Монголд
 *   байгаа тул Улаанбаатарын цагаар — серверийн локал бүсээр биш (Vercel нь
 *   UTC дээр ажилладаг). Монгол 2017-оос хойш DST хэрэглэхгүй боловч tz
 *   өгөгдлийн сангаар явсан нь хожим дүрэм солигдвол өөрөө зөв үлдэнэ.
 */

const TZ = "Asia/Ulaanbaatar";
const WORDS_PER_MINUTE = 200;

/**
 * Сарын дэс дарааллын дагавар — дуудлагын эгшиг зохицлоор.
 * нэгдүгээр, хоёрдугаар, гуравдугаар, дөрөвдүгээр, тавдугаар, зургаадугаар,
 * долоодугаар, наймдугаар, есдүгээр, аравдугаар, арван нэгдүгээр, арван хоёрдугаар.
 * Хүснэгтээр — алгоритмаар тооцвол уншихад ч, засахад ч бүрхэг болно.
 */
const MONTH_ORDINAL: Record<number, string> = {
  1: "дүгээр",
  2: "дугаар",
  3: "дугаар",
  4: "дүгээр",
  5: "дугаар",
  6: "дугаар",
  7: "дугаар",
  8: "дугаар",
  9: "дүгээр",
  10: "дугаар",
  11: "дүгээр",
  12: "дугаар",
};

function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

/** "2026 оны 11 дүгээр сарын 26" */
export function mnDate(d: Date): string {
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${year} оны ${month} ${MONTH_ORDINAL[month]} сарын ${day}`;
}

/**
 * "2026.11.26" — нүүрний гарчгийн блок.
 *
 * Artifact-ийн `fmt` (index.html:726) нь `${y}.${m}.${dd}`. Нүүр нь
 * artifact-тай яг тэнцүү байх ёстой тул урт монгол хэлбэрийг (`mnDate`)
 * тэнд хэрэглэхгүй — тэр нь нийтлэлийн хуудсанд үлдэнэ.
 */
export function mnNumericDate(d: Date): string {
  return `${d.getUTCFullYear()}.${pad2(d.getUTCMonth() + 1)}.${pad2(d.getUTCDate())}`;
}

/** "11.26" — тавиурын нурууны шошго */
export function mnShortDate(d: Date): string {
  return `${pad2(d.getUTCMonth() + 1)}.${pad2(d.getUTCDate())}`;
}

const UB_PARTS = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ,
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "11.26 14:30" — Улаанбаатарын цагаар */
export function mnDateTime(d: Date): string {
  const got: Record<string, string> = {};
  for (const part of UB_PARTS.formatToParts(d)) {
    got[part.type] = part.value;
  }
  return `${got.month}.${got.day} ${got.hour}:${got.minute}`;
}

/** Унших хугацаа минутаар, доод тал 1 */
export function readMinutes(body: string | null): number {
  const words = (body ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/**
 * `max` тэмдэгтэд тааруулж үгийн зааг дээр тасалж "…" нэмнэ.
 * Нэг ч үг багтахгүй бол (зайгүй урт текст) хязгаар дээр хүчээр тасална —
 * metaDescription нь зайгүй биетэд үүнээс хамаарна.
 */
export function excerpt(text: string | null, max: number): string {
  if (!text) return "";

  const s = text.trim();
  if (s.length <= max) return s;

  let cut = "";
  for (const word of s.split(/\s+/)) {
    const next = cut ? cut + " " + word : word;
    if (next.length > max) break;
    cut = next;
  }
  if (!cut) cut = s.slice(0, max);

  return cut + "…";
}
