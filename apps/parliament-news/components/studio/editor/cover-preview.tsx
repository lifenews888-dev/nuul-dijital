"use client";

import { useMemo } from "react";
import { coverInner, COVER_W, COVER_H } from "../../../lib/cover";
import { editorCoverInput } from "../../../lib/editor-cover";
import type { EditorState } from "../../../lib/editor-state";

/**
 * Амьд хавтас — бичиж байхдаа номоо хардаг.
 *
 * SVG-г `lib/cover.ts`-ийн `coverInner()` зурна, яг нийтийн сайтынхтай
 * ИЖИЛ функц. Хоёр дахь зурагч бичвэл редактор нэгийг хараад өөрийг нь
 * нийтэлнэ — энэ бол дизайны хамгийн чимээгүй эвдрэл.
 *
 * `dangerouslySetInnerHTML` нь энд аюулгүй: агуулга нь бидний өөрсдийн
 * зурагчийн гаргасан мөр бөгөөд тэр нь оролтоо `esc()`-дэг.
 */
export function CoverPreview({
  state,
  imageUrl,
}: {
  state: EditorState;
  imageUrl: string | null;
}) {
  const svg = useMemo(
    () => coverInner(editorCoverInput(state, imageUrl)),
    [state, imageUrl],
  );

  return (
    <div className="sticky top-5">
      <svg
        viewBox={`0 0 ${COVER_W} ${COVER_H}`}
        className="w-full max-w-[220px] rounded-[3px] shadow-[0_10px_30px_-12px_rgba(16,20,40,.45)]"
        role="img"
        aria-label={`Хавтасны урьдчилан харалт: ${state.title || "гарчиггүй"}`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <p className="mt-2 max-w-[220px] font-head text-[12px] leading-snug text-muted">
        Номын тавиур дээр ийм харагдана. Доорх «Дизайн мастер»-аар өөрчилнө.
      </p>
    </div>
  );
}
