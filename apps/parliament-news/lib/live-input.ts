/**
 * Нэгдсэн хуралдааны тохиргооны цэвэр дүрмүүд.
 *
 * `SEATS` нь `lib/hemicycle.ts`-тай ИЖИЛ байх ёстой: нүүрний хагас
 * дугуй яг 126 суудал зурдаг тул 130 гэж бичвэл суудал хэтэрнэ.
 */
import { SEATS as HEMICYCLE_SEATS } from "./hemicycle";

export const SEATS = HEMICYCLE_SEATS;

/** admin.html-ийн `s_st`-ийн сонголтууд */
export const SESSION_STATUSES = [
  "Хуралдаж байна",
  "Завсарлага",
  "Хойшлуулсан",
  "Хуралдаан дууссан",
];

/**
 * Уншигчийн хөтөчид ШИНЭ ЦОНХООР нээгдэх холбоос.
 *
 * `javascript:` эсвэл `data:` тэнд очвол уншигчийн хуудсан дээр код
 * ажиллана — «ШУУД» товч бол нүүрний хамгийн тод элемент.
 */
export function safeLink(url: string | undefined | null): boolean {
  return typeof url === "string" && /^https?:\/\/.+/i.test(url.trim());
}
