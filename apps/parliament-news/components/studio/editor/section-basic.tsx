"use client";

import { Field, Section, inputClass } from "./field";
import { autoFix } from "../../../lib/autofix";
import { LIMITS } from "../../../lib/studio-post-input";
import type { EditorState, EditorAction } from "../../../lib/editor-state";

/**
 * Үндсэн мэдээлэл — admin.html-ийн `data-sec="basic"` (:577-613).
 *
 * Хязгаарууд нь artifact-аас ЯГ хэвээр ба `postInputSchema`-тай нэг
 * эх сурвалжаас (`LIMITS`) ирнэ: хоёр газар бичвэл формд багтсан
 * текстийг сервер татгалзаж, редактор яагаад гэдгийг ойлгохгүй.
 */
export function SectionBasic({
  state,
  dispatch,
  categories,
  autoFormat,
  onAutoFormatChange,
}: {
  state: EditorState;
  dispatch: (a: EditorAction) => void;
  categories: string[];
  autoFormat: boolean;
  onAutoFormatChange: (v: boolean) => void;
}) {
  const set = (field: keyof EditorState, value: unknown) =>
    dispatch({ type: "set", field, value });

  return (
    <Section title="Үндсэн мэдээлэл">
      <Field label="Гарчиг" value={state.title} max={LIMITS.title}>
        <input
          className={inputClass}
          value={state.title}
          maxLength={LIMITS.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Жишээ: 2027 оны улсын төсвийг баталлаа"
          autoFocus
        />
      </Field>

      <div className="grid grid-cols-1 gap-x-3 md:grid-cols-2">
        <Field label="Ангилал">
          <select
            className={inputClass}
            value={state.categoryName}
            onChange={(e) => set("categoryName", e.target.value)}
          >
            <option value="">— сонгоогүй —</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Огноо">
          <input
            className={inputClass}
            type="date"
            value={state.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </Field>

        <Field label="Сурвалжлагч" value={state.reporter} max={LIMITS.reporter}>
          <input
            className={inputClass}
            value={state.reporter}
            maxLength={LIMITS.reporter}
            onChange={(e) => set("reporter", e.target.value)}
            placeholder="Б. Номин"
          />
        </Field>

        <Field
          label="Нурууны богино гарчиг"
          hint="номын нуруун дээр"
          value={state.kicker}
          max={LIMITS.kicker}
        >
          <input
            className={inputClass}
            value={state.kicker}
            maxLength={LIMITS.kicker}
            onChange={(e) => set("kicker", e.target.value)}
            placeholder="Гарчгаас автоматаар"
          />
        </Field>
      </div>

      <Field label="Шошго" hint="таслалаар тусгаарлана" value={state.tagsText} max={300}>
        <input
          className={inputClass}
          value={state.tagsText}
          maxLength={300}
          onChange={(e) => set("tagsText", e.target.value)}
          placeholder="Төсвийн байнгын хороо, Төсвийн тухай хууль, Г.Бат"
        />
      </Field>

      <Field
        label="Товч агуулга"
        hint="тавиурын доор, ар хавтас, сошиал пост дээр гарна"
        value={state.lead}
        max={LIMITS.lead}
      >
        <textarea
          className={inputClass}
          rows={3}
          value={state.lead}
          maxLength={LIMITS.lead}
          onChange={(e) => set("lead", e.target.value)}
          onBlur={(e) => autoFormat && set("lead", autoFix(e.target.value))}
          placeholder="1–2 өгүүлбэр"
        />
      </Field>

      <Field label="Дэлгэрэнгүй текст" value={state.body} max={LIMITS.body}>
        <textarea
          className={`${inputClass} min-h-[320px] font-body text-[15px] leading-relaxed`}
          rows={14}
          value={state.body}
          maxLength={LIMITS.body}
          onChange={(e) => set("body", e.target.value)}
          onBlur={(e) => autoFormat && set("body", autoFix(e.target.value))}
          placeholder="Мэдээний бүтэн текст. Догол мөрийг хоосон мөрөөр тусгаарлана."
        />
      </Field>

      {/*
        Автомат засвар нь ТАЛБАРААС ГАРАХАД ажиллана, бичиж байхад биш:
        бичиж байх үед засвал курсор үсэг бүрээр үсэрнэ.
      */}
      <label className="flex items-center gap-2 font-head text-[13px] text-muted">
        <input
          type="checkbox"
          checked={autoFormat}
          onChange={(e) => onAutoFormatChange(e.target.checked)}
        />
        Зай, цэг таслал, хашилтыг автоматаар засах
      </label>
    </Section>
  );
}
