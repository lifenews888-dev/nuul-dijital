/**
 * Сторины шилжилт — цэвэр тооцоо.
 *
 * Artifact-ийн `svShow(k)` нь `k >= SV.length` үед хаадаг. Энд `null` нь
 * тэр дохио: «цааш стори алга, давхаргыг хаа». Тойрог хийхгүй — стори нь
 * тавиур биш, эхлэл төгсгөлтэй дараалал.
 */

/** Нэг стори хэдэн миллисекунд (artifact-ийн `sDur`) */
export const STORY_MS = 6000;

export function nextStory(current: number, total: number, dir: 1 | -1): number | null {
  if (total <= 0) return null;
  if (!Number.isInteger(current) || current < 0 || current >= total) return null;
  const target = current + dir;
  return target >= 0 && target < total ? target : null;
}
