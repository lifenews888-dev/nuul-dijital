"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Section } from "./field";
import { trpc, trpcMessage } from "../../../lib/trpc-client";
import { checkUpload, maxBytes, type UploadKind } from "../../../lib/upload";
import type { StudioMedia } from "../../../lib/studio-post";

/**
 * Зураг ба видео — admin.html-ийн `data-sec="photos"` ба `"video"`.
 *
 * Файл нь хөтчөөс blob руу ШУУД явна (`@vercel/blob/client`): сервер
 * 200 МБ видеог дамжуулан өнгөрөөхгүй. Сервер нь токен гаргах үед
 * төрөл, хэмжээг хязгаарлана (`app/api/upload/route.ts`), байршуулалт
 * дууссаны дараа холбоосыг `attachMedia` бичнэ.
 *
 * Шалгалтыг ЭНД Ч хийнэ — 200 МБ татаж байгаад татгалзал авахаас
 * хамаагүй дээр.
 */
export function SectionMedia({
  postId,
  ensurePost,
  media,
  kind,
}: {
  postId: string | null;
  /**
   * Мэдээг санд БАЙГАА эсэхийг баталгаажуулна; байхгүй бол ноорог үүсгээд
   * id-г нь буцаана. Гарчиггүй бол `null` — гарчгийг зохиож болохгүй.
   */
  ensurePost: () => Promise<string | null>;
  media: StudioMedia[];
  kind: UploadKind;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = media.filter((m) => (kind === "video" ? m.kind === "video" : m.kind !== "video"));
  const title = kind === "image" ? "Зураг" : "Видео";

  async function send(file: File) {
    const check = checkUpload({ type: file.type, size: file.size }, kind);
    if (!check.ok) {
      setError(check.reason);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      /** Ноорог ЭХЛЭЭД — файл нь мэдээний id рүү холбогддог. */
      const id = await ensurePost();
      if (!id) {
        setError("Эхлээд гарчиг бичнэ үү — файл нь мэдээнд холбогдоно.");
        return;
      }

      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
        clientPayload: kind,
      });
      await trpc.studioNews.attachMedia.mutate({ postId: id, url: blob.url, kind });
      router.refresh();
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function caption(id: string, text: string) {
    setBusy(true);
    try {
      await trpc.studioNews.captionMedia.mutate({ id, caption: text });
      router.refresh();
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await trpc.studioNews.removeMedia.mutate({ id });
      router.refresh();
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const ids = items.map((m) => m.id);
    const [id] = ids.splice(from, 1);
    ids.splice(to, 0, id);
    setBusy(true);
    try {
      await trpc.studioNews.reorderMedia.mutate({ postId: postId!, ids });
      router.refresh();
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      title={title}
      hint={kind === "image" ? "эхний зураг ном хавтас болно" : undefined}
    >
      {/*
        Мэдээг ЭХЛЭЭД хадгалах ёстой: файл нь мэдээний id рүү
        холбогддог. Үүнийг хэлэхгүй бол «яагаад товч ажиллахгүй байна»
        гэсэн асуулт л үлдэнэ.
      */}
      {!postId ? (
        <p className="mb-2 font-head text-[13px] text-muted">
          Файл сонгоход ноорог автоматаар үүснэ — гарчиг л бичсэн байхад болно.
        </p>
      ) : null}
      <>
          {items.length > 0 ? (
            <ul className="mb-3 list-none p-0">
              {items.map((m, i) => (
                <li
                  key={m.id}
                  className="mb-1.5 grid grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg border border-line bg-inp p-2"
                >
                  {m.kind === "video" ? (
                    <span className="grid h-10 w-14 place-items-center rounded-md bg-soft font-head text-[11px] font-bold text-cob">
                      ВИДЕО
                    </span>
                  ) : (
                    <img
                      src={m.url}
                      alt=""
                      className="h-10 w-14 rounded-md object-cover"
                      loading="lazy"
                    />
                  )}

                  <span className="min-w-0">
                    {i === 0 && kind === "image" ? (
                      <b className="block font-head text-[11.5px] font-bold text-cob">
                        Хавтасны зураг
                      </b>
                    ) : null}
                    {/*
                      Тайлбар нь нийтлэлийн хуудсанд зургийн доор гарна
                      (`lib/posts.ts` нь `caption`-ийг сонгодог). `MEDIA`
                      үүргийн тодорхойлолт ч «зураг, видео, ТАЙЛБАРЫГ
                      засна» гэдэг.
                    */}
                    <input
                      className="w-full rounded-md border border-line bg-pan px-2 py-1 font-head text-[12.5px] text-ink"
                      defaultValue={m.caption ?? ""}
                      maxLength={200}
                      disabled={busy}
                      placeholder="Зургийн тайлбар · зурагчны нэр"
                      aria-label="Зургийн тайлбар"
                      onBlur={(e) => {
                        if (e.target.value === (m.caption ?? "")) return;
                        void caption(m.id, e.target.value);
                      }}
                    />
                  </span>

                  <span className="flex shrink-0 gap-1">
                    {kind === "image" ? (
                      <>
                        <button
                          type="button"
                          aria-label="Дээш"
                          disabled={i === 0 || busy}
                          onClick={() => void move(i, i - 1)}
                          className="h-8 w-8 rounded-md border border-line bg-pan text-[13px] text-muted disabled:opacity-40"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          aria-label="Доош"
                          disabled={i === items.length - 1 || busy}
                          onClick={() => void move(i, i + 1)}
                          className="h-8 w-8 rounded-md border border-line bg-pan text-[13px] text-muted disabled:opacity-40"
                        >
                          ↓
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      aria-label="Устгах"
                      disabled={busy}
                      onClick={() => void remove(m.id)}
                      className="h-8 w-8 rounded-md border border-line bg-pan text-[13px] text-muted hover:text-[#c0392b] disabled:opacity-40"
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {kind === "video" && items.length > 0 ? null : (
            <label className="inline-flex h-10 cursor-pointer items-center rounded-lg border border-line bg-pan px-4 font-head text-sm font-semibold text-ink hover:bg-soft">
              {busy ? "Байршуулж байна…" : `${title} нэмэх`}
              <input
                ref={fileRef}
                type="file"
                className="sr-only"
                accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/avif" : "video/mp4,video/webm"}
                disabled={busy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void send(f);
                }}
              />
            </label>
          )}

          <p className="mt-2 font-head text-[12.5px] text-muted">
            Дээд хэмжээ {Math.round(maxBytes(kind) / (1024 * 1024))} МБ.{" "}
            {kind === "image" ? "JPEG, PNG, WebP, AVIF." : "MP4 эсвэл WebM."}
          </p>
      </>

      {error ? (
        <p role="alert" className="mt-1.5 font-head text-[12.5px] font-semibold text-[#c0392b]">
          {error}
        </p>
      ) : null}
    </Section>
  );
}
