/**
 * Хөдөлгөөний цэвэр дүрмүүд.
 *
 * Шаталсан илчлэлт нь нүдийг хөтөлдөг ч, удаан шатлал нь уншигчийг
 * ХҮЛЭЭЛГЭНЭ: арван картын аравдугаарх нь хагас секундын дараа гарвал
 * тэр нь амьд биш, удаан санагдана. Тиймээс дээд хязгаартай.
 */

/** Карт хоорондын саатал, мс */
export const REVEAL_STEP = 60;

/** Шатлалын ДЭЭД хязгаар, мс */
export const REVEAL_MAX = 300;

export function revealDelay(index: number): number {
  if (!Number.isFinite(index) || index <= 0) return 0;
  return Math.min(REVEAL_MAX, Math.round(index) * REVEAL_STEP);
}
