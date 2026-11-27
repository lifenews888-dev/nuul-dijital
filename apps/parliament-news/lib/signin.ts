/**
 * Нэвтрэлтийн дараа хаана буух вэ — нээлттэй дахин чиглүүлэлтээс хамгаалсан.
 */

/** Эрхээс үл хамааран бүх үүрэг харж чадах хуудас */
export const SIGNIN_DEFAULT = "/studio/news";

const STUDIO_PREFIX = "/studio/";
const SIGNIN_PATH = "/studio/signin";

/**
 * `callbackUrl`-ийг цэвэрлэнэ: ЗӨВХӨН студийн доторх зам хэвээр, бусад
 * бүгд `SIGNIN_DEFAULT`.
 *
 * Цагаан дэвтэр (зөвшөөрөгдсөнийг нэрлэх), хар дэвтэр биш: хар дэвтэр нь
 * `//`, `\`, `%2f`, `javascript:` гэх мэт хэлбэрүүдийг нэг нэгээр хаах
 * тэмцэл болдог ба нэгийг мартахад хамгаалалт нь бүхэлдээ нээгдэнэ.
 */
export function safeCallbackUrl(raw: string | null | undefined): string {
  if (typeof raw !== "string") return SIGNIN_DEFAULT;

  const url = raw.trim();
  if (!url.startsWith(STUDIO_PREFIX)) return SIGNIN_DEFAULT;

  /** `\` нь хөтөчид `/` мэт уншигдана: `/\evil.mn` → `//evil.mn` */
  if (url.includes("\\")) return SIGNIN_DEFAULT;

  /**
   * `/studio/../news` нь студиэс гарна.
   *
   * `%2e` ба `%2f`-ийг мөн барина: WHATWG-ийн URL дүрмээр `%2e%2e` нь
   * `..`-тай ЯГ адил тул `/studio/%2e%2e/%2e%2e/evil` нь хөтөч дээр
   * `/evil` болж шийдэгдэнэ. Домэйн солигдохгүй тул нээлттэй дахин
   * чиглүүлэлт биш, гэхдээ «зөвхөн студийн доторх зам» гэсэн гэрээг
   * зөрчинө — цагаан дэвтрийн хувьд тэр нь аль хэдийн хангалттай шалтгаан.
   */
  if (url.includes("..") || /%2[ef]|%5c/i.test(url)) return SIGNIN_DEFAULT;

  const path = url.split(/[?#]/)[0];
  if (path === SIGNIN_PATH || path.startsWith(SIGNIN_PATH + "/")) return SIGNIN_DEFAULT;

  return url;
}

/**
 * Нэвтрэх хуудас ЮУ харуулах вэ.
 *
 * Гурван төлөв бий, хоёр биш. «Нэвтэрсэн ч редакцын гишүүн биш» нь
 * тусдаа төлөв: хаалга тэр хүнийг энд шиднэ, гэтэл хоосон форм зурвал
 * тэр нь буруу нууц үгтэй ЯГ АДИЛ харагдана. Хүн зөв нууц үгээ дахин
 * дахин бичиж, «нууц үг ажиллахаа больсон» гэж мэдэгдэнэ; ерөнхий
 * редактор сайн байсан нууц үгийг сэргээнэ. Гарах товч нь тэр хүн
 * хүрч чадахгүй самбарт байдаг тул гацна.
 *
 * `TenantMember.active` нь `false` болсон хүн яг ийм төлөвт унана.
 */
export type SigninView = "form" | "redirect" | "no-access";

export function signinView(state: { signedIn: boolean; hasStudio: boolean }): SigninView {
  if (state.hasStudio) return "redirect";
  return state.signedIn ? "no-access" : "form";
}
