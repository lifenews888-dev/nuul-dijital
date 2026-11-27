/**
 * Цаг агаар ба валютын ханшийн ЦЭВЭР дүрмүүд — artifact-ийн `applyInfo()`.
 *
 * Гурван хэрэглэгчтэй: гүйдэг мөрийн баруун тал (`.tinfo`), цэсний
 * «ӨНӨӨДӨР» блок (`.minfo`), утасны хэвтээ зурвас (`.minfo2`). Гурвуулаа
 * нэг өгөгдлийг ӨӨР өөр нягтралтайгаар харуулдаг тул шүүлт, бөөрөнхийлөлт,
 * тэмдэг нь энд нэг л газарт байна.
 */

/** Гадаад валютын тэмдэг. Танихгүй код нь тэмдэггүй — буруу тэмдэг зурахаас дээр. */
export const CURRENCY_SYMBOL: Record<string, string | undefined> = {
  USD: "$",
  EUR: "€",
  CNY: "¥",
  RUB: "₽",
  KRW: "₩",
  JPY: "¥",
};

/**
 * Цаг агаарын төлөв → тэмдгийн нэр. Artifact-ийн `WXI`: `cloud` нь
 * НАРТАЙ ҮҮЛТЭЙ тэмдгийг, `over` (бүрхэг) нь цэвэр үүлийг авдаг.
 */
export const WEATHER_ICON: Record<string, string | undefined> = {
  sun: "sun",
  cloud: "cloudsun",
  over: "cloud",
  snow: "snow",
  rain: "rain",
  wind: "wind",
  fog: "fog",
};

/** Цэсэнд дээд тал нь зургаа, гүйдэг мөрөнд гурав */
export const FX_MAX = 6;
export const TICKER_FX = 3;

const CODE = /^[A-Z]{3}$/;

export type FxRow = { code: string; value: number; change: number };

/**
 * Харуулахад тэнцэх ханшийн мөрүүд.
 *
 * Код нь ЯГ гурван том үсэг: сан нь `VarChar(8)` тул `USDT`, `usd` ч багтана,
 * гэхдээ тэдгээр нь валютын албан ёсны код БИШ. Дарааллыг хадгална — редакц
 * `order`-оор эрэмбэлсэн байна.
 */
export function validFx(rows: FxRow[]): FxRow[] {
  return rows
    .filter((r) => CODE.test(r.code) && Number.isFinite(r.value))
    .slice(0, FX_MAX);
}

/** "3 450" — монгол бичлэг, хоёр аравтын орон хүртэл */
export function mnNumber(value: number): string {
  return value.toLocaleString("mn-MN", { maximumFractionDigits: 2 });
}

/**
 * Өөрчлөлтийн сум. Тэг нь `null`: өөрчлөгдөөгүй ханшид ▲ эсвэл ▼ зурах нь
 * уншигчид худал хэлнэ. Утга нь ҮНЭМЛЭХҮЙ — чиглэлийг сум өөрөө хэлнэ.
 */
export function changeOf(change: number): { dir: "up" | "dn"; text: string } | null {
  if (!Number.isFinite(change) || change === 0) return null;
  return { dir: change > 0 ? "up" : "dn", text: mnNumber(Math.abs(change)) };
}

export type WeatherInput = { city: string; t: number; icon: string; text: string } | null;
export type WeatherView = { icon: string; temp: number; city: string; text: string };

/**
 * Харуулахад тэнцэх цаг агаар. Температур тоо биш бол БҮХ блок алга болно —
 * хоттой, тэмдэгтэй, харин "—°C" гэсэн хайрцаг нь мэдээлэлгүй.
 */
export function weatherView(w: WeatherInput): WeatherView | null {
  if (!w || !Number.isFinite(w.t)) return null;
  return {
    icon: WEATHER_ICON[w.icon] ?? "thermo",
    temp: Math.round(w.t),
    city: w.city.trim() || "Улаанбаатар",
    text: w.text,
  };
}
