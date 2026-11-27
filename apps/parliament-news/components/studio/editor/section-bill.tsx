"use client";

import { Section, inputClass } from "./field";
import { BILL_STAGES } from "../../../lib/bill-stages";
import type { EditorState, EditorAction } from "../../../lib/editor-state";

/**
 * Хуулийн төсөл ба санал хураалт — admin.html-ийн `data-sec="bill"`.
 *
 * Таван шат нь `lib/bill-stages.ts`-д, нийтийн хуудастай НЭГ эх
 * сурвалжаас: шатны нэрийг хоёр газар бичвэл тэд салж, редактор нэгийг,
 * уншигч нөгөөг нь харна.
 */
export function SectionBill({
  state,
  dispatch,
}: {
  state: EditorState;
  dispatch: (a: EditorAction) => void;
}) {
  const set = (field: keyof EditorState, value: unknown) =>
    dispatch({ type: "set", field, value });

  const setNote = (index: number, note: string) =>
    set(
      "billNotes",
      state.billNotes.map((n, i) => (i === index ? note : n)),
    );

  return (
    <Section title="Хуулийн төсөл ба санал хураалт">
      <label className="mb-3 flex items-center gap-2 font-head text-sm text-ink">
        <input
          type="checkbox"
          checked={state.billEnabled}
          onChange={(e) => set("billEnabled", e.target.checked)}
        />
        Энэ мэдээ хуулийн төслийн явцыг харуулна
      </label>

      {state.billEnabled ? (
        <>
          <div className="grid grid-cols-1 gap-x-3 md:grid-cols-3">
            <label className="mb-3 block">
              <span className="mb-1.5 block font-head text-[13px] font-semibold text-muted">
                Төслийн шат
              </span>
              <select
                className={inputClass}
                value={state.billStage}
                onChange={(e) => set("billStage", Number(e.target.value))}
              >
                {BILL_STAGES.map((label, i) => (
                  <option key={label} value={i}>
                    {i + 1}. {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="mb-3 block">
              <span className="mb-1.5 block font-head text-[13px] font-semibold text-muted">
                Дэмжсэн
              </span>
              <input
                className={inputClass}
                type="number"
                min={0}
                max={1000}
                value={state.votesYes}
                onChange={(e) => set("votesYes", Number(e.target.value) || 0)}
              />
            </label>

            <label className="mb-3 block">
              <span className="mb-1.5 block font-head text-[13px] font-semibold text-muted">
                Татгалзсан
              </span>
              <input
                className={inputClass}
                type="number"
                min={0}
                max={1000}
                value={state.votesNo}
                onChange={(e) => set("votesNo", Number(e.target.value) || 0)}
              />
            </label>
          </div>

          <p className="mb-2 font-head text-[13px] text-muted">
            Шат бүрийн тайлбар — нийтлэлийн доорх явцын мөрөнд гарна.
          </p>

          {BILL_STAGES.map((label, i) => (
            <label key={label} className="mb-2 block">
              <span
                className={
                  "mb-1 block font-head text-[12.5px] font-semibold " +
                  (i === state.billStage ? "text-cob" : "text-muted")
                }
              >
                {i + 1}. {label}
                {i === state.billStage ? " — одоогийн шат" : ""}
              </span>
              <textarea
                className={`${inputClass} min-h-[44px]`}
                rows={2}
                maxLength={400}
                value={state.billNotes[i] ?? ""}
                onChange={(e) => setNote(i, e.target.value)}
                placeholder="Огноо, тогтоолын дугаар, товч тайлбар"
              />
            </label>
          ))}
        </>
      ) : null}
    </Section>
  );
}
