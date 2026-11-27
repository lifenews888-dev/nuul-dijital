import { parseLook, type CoverInput } from "./cover";
import type { EditorState } from "./editor-state";

/**
 * Формын төлөвөөс хавтасны оролт руу — ЗӨВХӨН хөрвүүлэлт.
 *
 * Хавтсыг `lib/cover.ts` ганцаараа зурна. Энд хоёр дахь зурагч бичвэл
 * засварлагчийн урьдчилан харалт ба нийтийн сайтын ном салж, редактор
 * юу нийтлэхээ мэдэхгүй болно.
 */

/** Хоосон ном нь загвар биш, алдаа мэт харагдана */
const UNTITLED = "(гарчиггүй)";

/** admin.html-ийн `norm()`: ангилалгүй мэдээ «Мэдээ» болно */
const NO_CATEGORY = "Мэдээ";

/**
 * Гарчгийн хэмжээ: UI нь ХУВЬ (80-125), хавтас нь ЭЗЛЭХҮҮН (0.8-1.25).
 *
 * `lib/cover.ts:287` нь `clamp(0.8, 1.25, o.size || 1)` гэж уншина —
 * 80 гэж бичвэл 1.25 болж хавчигдаж, гарчиг хамгийн томд түгжигдэнэ.
 * `admin.html:1109` нь 100-д хуваадаг; энд ч мөн адил, гэхдээ ГАНЦ
 * газар.
 */
export function sizeFraction(percent: number): number {
  return percent / 100;
}

export function sizePercent(fraction: number | undefined): number {
  return fraction === undefined ? 100 : Math.round(fraction * 100);
}

/**
 * Хоёр өнгөөр будах нь АНХДАГЧААР АСААЛТТАЙ — `cover.ts:288`-ийн
 * `o.duo !== false`. `duo === true` гэж уншвал шинэ мэдээн дээр нүд нь
 * хоосон атлаа зураг будагдсан байж, эхний дарлат юу ч өөрчлөхгүй.
 */
export function duoOn(duo: unknown): boolean {
  return duo !== false;
}

function parseDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function editorCoverInput(state: EditorState, imageUrl: string | null): CoverInput {
  return {
    title: state.title.trim() || UNTITLED,
    kicker: state.kicker || null,
    lead: state.lead || null,
    categoryName: state.categoryName || NO_CATEGORY,
    motif: state.motif,
    theme: state.theme,
    look: parseLook(state.look),
    imageUrl,
    featured: state.featured,
    date: parseDate(state.date),
  };
}
