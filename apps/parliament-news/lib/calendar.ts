/**
 * «Сануулах» холбоос — artifact-ийн `gcal()`.
 *
 * Хуваарийн мөрийг Google Calendar-ийн загварын цонх руу илгээнэ. Хугацаа
 * нь нэг цаг, бүс нь `ctz=Asia/Ulaanbaatar` — өөр бүсэд байгаа уншигчийн
 * хуанлид зөв цагт буух ёстой.
 */
const TZ = "Asia/Ulaanbaatar";
const BASE = "https://calendar.google.com/calendar/render";
const DEFAULT_TIME = [10, 0] as const;

const p2 = (n: number) => String(n).padStart(2, "0");

function parseTime(time: string): readonly [number, number] {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return DEFAULT_TIME;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return DEFAULT_TIME;
  return [h, min];
}

export function calendarUrl(time: string, text: string, day: Date): string {
  const [h, min] = parseTime(time);
  const ymd = `${day.getUTCFullYear()}${p2(day.getUTCMonth() + 1)}${p2(day.getUTCDate())}`;
  // Artifact-ийн адил: төгсгөл нь ижил өдөр дээр, цаг нь 24-өөр эргэлдэнэ
  const start = `${ymd}T${p2(h)}${p2(min)}00`;
  const end = `${ymd}T${p2((h + 1) % 24)}${p2(min)}00`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `УИХ: ${text}`,
    dates: `${start}/${end}`,
    ctz: TZ,
    details: "Parliament News — parlamentnews.mn",
  });
  return `${BASE}?${params.toString()}`;
}
