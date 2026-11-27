"use client";

import { Section, inputClass } from "./field";
import {
  LOOK_PRESETS,
  LAYOUT_CHOICES,
  FONT_CHOICES,
  FOCUS_CHOICES,
  SIZE_RANGE,
  MOTIF_CHOICES,
} from "../../../lib/look-presets";
import { coverInner, palette, parseLook, COVER_W, COVER_H } from "../../../lib/cover";
import { editorCoverInput, sizePercent, sizeFraction, duoOn } from "../../../lib/editor-cover";
import type { EditorState, EditorAction } from "../../../lib/editor-state";

/**
 * Дизайн мастер — admin.html-ийн `data-sec="look"` (:634-650).
 *
 * Бэлэн загварууд нь ЖИЖИГ НОМ болж харагдана, зөвхөн нэр биш: өнгөний
 * хослолыг нэрээр нь төсөөлөх боломжгүй. Тэд өөрсдөө `lib/cover.ts`-ээр
 * зурагддаг тул бодит хавтастай яг таарна.
 */
export function SectionLook({
  state,
  dispatch,
  imageUrl,
}: {
  state: EditorState;
  dispatch: (a: EditorAction) => void;
  imageUrl: string | null;
}) {
  const look = state.look as Record<string, unknown>;
  const setLook = (key: string, value: unknown) => dispatch({ type: "look", key, value });

  /** Одоогийн бодит өнгөнүүд — хэрэглэгч `look`-д тавиагүй бол палитрынх */
  const [bg, fg, ac] = palette(state.theme, parseLook(state.look));

  /** Санд ЭЗЛЭХҮҮН, гулсуурт ХУВЬ */
  const size = sizePercent(typeof look.size === "number" ? look.size : undefined);
  const lay = (look.lay as string) ?? "top";
  const font = (look.font as string) ?? "sans";
  const fy = typeof look.fy === "number" ? look.fy : 50;

  const applyPreset = (index: number) => {
    const preset = LOOK_PRESETS[index];
    dispatch({ type: "set", field: "theme", value: preset.theme });
    dispatch({ type: "look", key: null, value: null });
    for (const [k, v] of Object.entries(preset.look)) {
      dispatch({ type: "look", key: k, value: v });
    }
  };

  return (
    <Section title="Дизайн мастер" hint="номын хавтсыг хүссэнээрээ">
      <span className="mb-2 block font-head text-[13px] font-semibold text-muted">
        Бэлэн загвар
      </span>
      <div className="mb-4 flex flex-wrap gap-2">
        {LOOK_PRESETS.map((preset, i) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => applyPreset(i)}
            title={preset.name}
            className="w-[62px] shrink-0 rounded-md border border-line bg-pan p-1 text-left hover:border-cob"
          >
            <svg
              viewBox={`0 0 ${COVER_W} ${COVER_H}`}
              className="block w-full rounded-[2px]"
              aria-hidden="true"
              dangerouslySetInnerHTML={{
                __html: coverInner(
                  editorCoverInput(
                    { ...state, theme: preset.theme, look: preset.look as Record<string, unknown> },
                    imageUrl,
                  ),
                ),
              }}
            />
            <span className="mt-1 block truncate font-head text-[10.5px] font-semibold text-muted">
              {preset.name}
            </span>
          </button>
        ))}
      </div>

      <span className="mb-1.5 block font-head text-[13px] font-semibold text-muted">Өнгө</span>
      <div className="mb-4 flex flex-wrap gap-3">
        {([
          ["bg", "Дэвсгэр", bg],
          ["fg", "Бичиг", fg],
          ["ac", "Онцлох", ac],
        ] as const).map(([key, label, value]) => (
          <label key={key} className="flex items-center gap-1.5 font-head text-[13px] text-ink">
            <input
              type="color"
              value={value}
              onChange={(e) => setLook(key, e.target.value.toUpperCase())}
              className="h-9 w-10 cursor-pointer rounded-md border border-line bg-pan p-0.5"
              aria-label={label}
            />
            {label}
          </label>
        ))}
      </div>

      <Segmented
        label="Зохиомж"
        value={lay}
        options={LAYOUT_CHOICES.map((l) => ({ value: l.value, label: l.label }))}
        onChange={(v) => setLook("lay", v)}
      />

      <Segmented
        label="Гарчгийн фонт"
        value={font}
        options={FONT_CHOICES.map((f) => ({ value: f.value, label: f.label }))}
        onChange={(v) => setLook("font", v)}
      />

      <label className="mb-3 block">
        <span className="mb-1.5 flex items-baseline gap-2 font-head text-[13px] font-semibold text-muted">
          Гарчгийн хэмжээ
          <em className="font-normal not-italic tabular-nums">{`${size}%`}</em>
        </span>
        <input
          type="range"
          min={SIZE_RANGE.min}
          max={SIZE_RANGE.max}
          step={SIZE_RANGE.step}
          value={size}
          onChange={(e) => setLook("size", sizeFraction(Number(e.target.value)))}
          className="w-full max-w-[280px]"
        />
      </label>

      {/* Зургийн төвлөрөл нь зурагтай үед л утгатай */}
      {imageUrl ? (
        <>
          <Segmented
            label="Зургийн төвлөрөл"
            value={String(fy)}
            options={FOCUS_CHOICES.map((f) => ({ value: String(f.value), label: f.label }))}
            onChange={(v) => setLook("fy", Number(v))}
          />
          <label className="mb-3 flex items-center gap-2 font-head text-sm text-ink">
            <input
              type="checkbox"
              checked={duoOn(look.duo)}
              onChange={(e) => setLook("duo", e.target.checked)}
            />
            Зургийг брэндийн 2 өнгөөр будах
          </label>
        </>
      ) : null}

      <button
        type="button"
        onClick={() => dispatch({ type: "look", key: null, value: null })}
        className="mb-4 h-9 rounded-lg border border-line bg-pan px-3 font-head text-[13px] font-semibold text-muted hover:text-ink"
      >
        ↺ Анхны байдалд
      </button>

      <label className="block">
        <span className="mb-1.5 block font-head text-[13px] font-semibold text-muted">
          Зураггүй үеийн хавтасны график
        </span>
        <select
          className={inputClass}
          value={state.motif}
          onChange={(e) => dispatch({ type: "set", field: "motif", value: e.target.value })}
        >
          {MOTIF_CHOICES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
    </Section>
  );
}

/** admin.html-ийн `.seg2` — хэдэн сонголтын нэг эгнээ */
function Segmented({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <span className="mb-1.5 block font-head text-[13px] font-semibold text-muted">{label}</span>
      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-inp p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={o.value === value}
            onClick={() => onChange(o.value)}
            className={
              "h-8 rounded-md px-3 font-head text-[13px] font-semibold " +
              (o.value === value ? "bg-cob text-white" : "text-muted hover:text-ink")
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
