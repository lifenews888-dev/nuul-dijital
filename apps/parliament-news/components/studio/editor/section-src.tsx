"use client";

import { useState } from "react";
import { Section, inputClass } from "./field";
import { LIMITS } from "../../../lib/studio-post-input";
import type { EditorState, EditorAction } from "../../../lib/editor-state";

/**
 * Эх сурвалж ба холбоос — admin.html-ийн `data-sec="src"` (:652).
 *
 * Нийтлэлийн доор «Эх сурвалж» хэсэгт гарна. Сервер нь `http(s)`-ээс
 * бусдыг татгалзана (`postInputSchema`) — энд мөн шалгана, гэхдээ тэр
 * нь зөвхөн алдааг ЭРТ хэлэхийн тул: редактор хадгалаад л татгалзал
 * авахаас илүү, бичиж байхдаа мэдэх нь дээр.
 */
export function SectionSrc({
  state,
  dispatch,
}: {
  state: EditorState;
  dispatch: (a: EditorAction) => void;
}) {
  const [draft, setDraft] = useState("");
  const set = (sources: string[]) => dispatch({ type: "set", field: "sources", value: sources });

  const valid = /^https?:\/\/.+/i.test(draft.trim());
  const full = state.sources.length >= LIMITS.sources;

  function add() {
    const url = draft.trim();
    if (!valid || full || state.sources.includes(url)) return;
    set([...state.sources, url]);
    setDraft("");
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= state.sources.length) return;
    const next = [...state.sources];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    set(next);
  }

  return (
    <Section
      title="Эх сурвалж ба холбоос"
      hint={`${state.sources.length}/${LIMITS.sources}`}
    >
      <p className="mb-3 font-head text-[13px] text-muted">
        Албан баримт, хуулийн төсөл, тогтоол, видео бичлэг болон холбогдох мэдээ. Нийтлэлийн
        доор «Эх сурвалж» хэсэгт гарна.
      </p>

      {state.sources.length > 0 ? (
        <ol className="mb-3 list-none p-0">
          {state.sources.map((url, i) => (
            <li
              key={url}
              className="mb-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-line bg-inp px-3 py-2"
            >
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-head text-[13px] text-cob underline"
                dir="ltr"
              >
                {url}
              </a>
              <span className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label="Дээш"
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  className="h-8 w-8 rounded-md border border-line bg-pan font-head text-[13px] text-muted disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Доош"
                  disabled={i === state.sources.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="h-8 w-8 rounded-md border border-line bg-pan font-head text-[13px] text-muted disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label="Устгах"
                  onClick={() => set(state.sources.filter((_, k) => k !== i))}
                  className="h-8 w-8 rounded-md border border-line bg-pan font-head text-[13px] text-muted hover:text-[#c0392b]"
                >
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {!full ? (
        <div className="flex flex-wrap gap-2">
          <input
            className={`${inputClass} flex-1`}
            type="url"
            inputMode="url"
            dir="ltr"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                /** Формын бүхэл хадгалалтыг ажиллуулахгүй — зөвхөн мөр нэмнэ */
                e.preventDefault();
                add();
              }
            }}
            placeholder="https://parliament.mn/…"
            aria-label="Эх сурвалжийн холбоос"
          />
          <button
            type="button"
            onClick={add}
            disabled={!valid}
            className="h-11 rounded-lg border border-line bg-pan px-4 font-head text-sm font-semibold text-ink disabled:opacity-50"
          >
            Нэмэх
          </button>
        </div>
      ) : (
        <p className="font-head text-[13px] text-muted">
          Хорин эх сурвалж хангалттай — нэмэхийн тулд аль нэгийг нь устгана уу.
        </p>
      )}

      {draft.trim() && !valid ? (
        <p className="mt-1.5 font-head text-[12.5px] font-semibold text-[#c0392b]">
          Холбоос нь http:// эсвэл https:// -ээр эхлэх ёстой.
        </p>
      ) : null}
    </Section>
  );
}
