import type { SendResult } from "../social-result";

/**
 * Хараахан тохируулаагүй сувгууд — Facebook, Instagram, YouTube, TikTok.
 *
 * Эдгээр нь апп бүртгүүлэх, OAuth, платформын тойм шаарддаг бөгөөд тэр
 * ажил нь кодын биш, бүртгэлийн. Токен орж ирэхэд адаптер нь энд
 * солигдоно; дараалал, төлөв, дахин оролдлого бүгд бэлэн байна.
 *
 * `configured: false` нь мөрийг SKIPPED болгоно — алдаа гэж тоологдохгүй,
 * хязгааргүй дахин оролдохгүй.
 */
export function notConfigured(channel: string): SendResult {
  return {
    ok: false,
    configured: false,
    error: `${channel} сувгийн холболт хараахан тохируулаагүй`,
  };
}
