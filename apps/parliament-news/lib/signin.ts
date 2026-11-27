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

  /** `/studio/../news` нь студиэс гарна */
  if (url.includes("..")) return SIGNIN_DEFAULT;

  const path = url.split(/[?#]/)[0];
  if (path === SIGNIN_PATH || path.startsWith(SIGNIN_PATH + "/")) return SIGNIN_DEFAULT;

  return url;
}
