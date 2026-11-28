"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { Section, inputClass } from "./field";
import { checkUpload } from "../../../lib/upload";
import { trpcMessage } from "../../../lib/trpc-client";
import { STATUS_LABELS, STATUS_ORDER } from "../../../lib/studio-status";
import { canSetStatusManually, type Actor } from "../../../lib/permissions";
import type { EditorState, EditorAction } from "../../../lib/editor-state";

/** admin.html-ийн `CH` */
/** admin.html-ийн `CH`. «Telegram» нь НЭМЭЛТ: гурван сүлжээнээс
 *  зөвхөн түүний автомат нийтлэл бүрэн хэрэгжсэн. */
const CHANNELS = ["Сайт", "Facebook", "YouTube", "Instagram", "TikTok", "Telegram"];

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

      {state.story ? <StoryMedia state={state} set={set} /> : null}

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

/**
 * Сторины БОСОО медиа.
 *
 * Мэдээний зураг нь ихэвчлэн хэвтээ; түүнийг 9:16 хүрээнд тайрахад хүний
 * толгой, гарчгийн текст эхэлж тасардаг. Босоо бичлэг эсвэл босоо зураг нь
 * тусдаа талбар — нийтлэлийн зурагтай хамааралгүй.
 *
 * Оруулаагүй бол стори нь хуучин замаараа: мэдээний зураг, тэр ч байхгүй бол
 * текстгүй хавтас.
 */
function StoryMedia({
  state,
  set,
}: {
  state: EditorState;
  set: (field: keyof EditorState, value: unknown) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const video = /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(state.storyUrl);

  async function pick(file: File | undefined) {
    if (!file) return;
    const kind = file.type.startsWith("video/") ? "video" : "image";
    const check = checkUpload({ type: file.type, size: file.size }, kind);
    if (!check.ok) {
      setError(check.reason);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: kind,
      });
      set("storyUrl", blob.url);
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="mb-4">
      <div className="mb-1.5 font-head text-[12.5px] text-muted">
        Сторины босоо медиа <span className="font-normal">— 9:16, видео эсвэл зураг</span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => void pick(e.target.files?.[0])}
      />

      <div className="flex items-start gap-3">
        <button
          type="button"
          className="grid h-32 w-[72px] place-items-center overflow-hidden rounded-lg border border-line bg-inp"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          aria-label="Сторины медиа сонгох"
        >
          {state.storyUrl ? (
            video ? (
              <video src={state.storyUrl} muted className="h-full w-full object-cover" />
            ) : (
              <img src={state.storyUrl} alt="" className="h-full w-full object-cover" />
            )
          ) : (
            <span className="font-head text-[12px] text-muted">＋</span>
          )}
        </button>

        <div className="grid gap-1.5">
          <p className="max-w-[320px] font-head text-[12.5px] text-muted">
            Оруулаагүй бол мэдээний зураг, тэр ч байхгүй бол номын хавтас гарна.
          </p>
          {state.storyUrl ? (
            <button
              type="button"
              className="justify-self-start font-head text-[12.5px] text-muted underline"
              onClick={() => set("storyUrl", "")}
            >
              Хасах
            </button>
          ) : null}
          {error ? (
            <p role="alert" className="font-head text-[12.5px] font-semibold text-[#c0392b]">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
