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
