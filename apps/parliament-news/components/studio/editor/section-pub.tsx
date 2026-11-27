"use client";

import { Section, inputClass } from "./field";
import { STATUS_LABELS, STATUS_ORDER } from "../../../lib/studio-status";
import { canSetStatusManually, type Actor } from "../../../lib/permissions";
import type { EditorState, EditorAction } from "../../../lib/editor-state";

/** admin.html-ийн `CH` */
const CHANNELS = ["Сайт", "Facebook", "YouTube", "Instagram", "TikTok"];

/** admin.html-ийн `f_sdur` */
const STORY_DURATIONS = [
  { days: 1, label: "24 цаг" },
  { days: 3, label: "3 өдөр" },
  { days: 7, label: "7 хоног" },
  { days: 0, label: "Хугацаагүй" },
];

/**
 * Нийтлэх суваг, онцлох, стори, төлөв — admin.html-ийн `data-sec="pub"`.
 *
 * Төлөвийн `<select>` нь ЗӨВХӨН супер админд: бусад бүх хүн урсгалын
 * товчоор л төлөв хөдөлгөнө (`studioNews.act`). Сервер нь мөн адил
 * шалгана (`canSetStatusManually`).
 */
export function SectionPub({
  state,
  dispatch,
  actor,
}: {
  state: EditorState;
  dispatch: (a: EditorAction) => void;
  actor: Actor;
}) {
  const set = (field: keyof EditorState, value: unknown) =>
    dispatch({ type: "set", field, value });

  const toggleChannel = (name: string) =>
    set(
      "channels",
      state.channels.includes(name)
        ? state.channels.filter((c) => c !== name)
        : [...state.channels, name],
    );

  return (
    <Section title="Нийтлэх суваг">
      <div className="mb-4 flex flex-wrap gap-2">
        {CHANNELS.map((name) => {
          const on = state.channels.includes(name);
          return (
            <button
              key={name}
              type="button"
              aria-pressed={on}
              onClick={() => toggleChannel(name)}
              className={
                "h-9 rounded-full border px-3.5 font-head text-[13px] font-semibold " +
                (on ? "border-cob bg-soft text-cob" : "border-line bg-pan text-muted")
              }
            >
              {name}
            </button>
          );
        })}
      </div>

      <label className="mb-3 flex items-center gap-2 font-head text-sm text-ink">
        <input
          type="checkbox"
          checked={state.featured}
          onChange={(e) => set("featured", e.target.checked)}
        />
        Онцлох мэдээ
        <span className="font-normal text-muted">— хавтас дээр од гарна</span>
      </label>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 font-head text-sm text-ink">
          <input
            type="checkbox"
            checked={state.story}
            onChange={(e) => set("story", e.target.checked)}
          />
          Стори болгох
        </label>

        {state.story ? (
          <select
            className="h-10 rounded-lg border border-line bg-inp px-2.5 font-head text-sm text-ink"
            value={state.storyDays}
            onChange={(e) => set("storyDays", Number(e.target.value))}
            aria-label="Сторийн хугацаа"
          >
            {STORY_DURATIONS.map((d) => (
              <option key={d.days} value={d.days}>
                {d.label}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {canSetStatusManually(actor) ? (
        <label className="block max-w-[280px]">
          <span className="mb-1.5 block font-head text-[13px] font-semibold text-muted">
            Төлөв <em className="font-normal not-italic">супер админ гараар сольно</em>
          </span>
          <select
            className={inputClass}
            value={state.status}
            onChange={(e) => set("status", e.target.value)}
          >
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          {/*
            Ирээдүйн огноотой «Нийтлэгдсэн» мэдээ нийтийн хуудсанд
            ГАРАХГҮЙ — нийтийн шүүлт нь `publishedAt <= now`. Үүнийг
            хэлэхгүй бол редактор мэдээгээ гарсан гэж бодно.
          */}
          {state.status === "PUBLISHED" ? (
            <span className="mt-1.5 block font-head text-[12.5px] text-muted">
              Нийтлэх товчоор нийтэлбэл огноо автоматаар тавигдана. Гараар тавьсан
              «Нийтлэгдсэн» төлөв нь огноогоо шинэчлэхгүй тул мэдээ сайтад
              гарахгүй байж болно.
            </span>
          ) : null}
        </label>
      ) : null}
    </Section>
  );
}
