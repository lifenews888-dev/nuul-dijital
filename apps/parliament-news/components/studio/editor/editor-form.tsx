"use client";

import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  editorReducer,
  editorFromPost,
  editorToInput,
  emptyEditor,
  isDirty,
  type EditorState,
} from "../../../lib/editor-state";
import { sectionsFor, type Actor, type Section as PermSection } from "../../../lib/permissions";
import { trpc, trpcMessage } from "../../../lib/trpc-client";
import type { StudioPostFull } from "../../../lib/studio-post";
import { FlowBar } from "./flow-bar";
import { SectionBasic } from "./section-basic";
import { SectionSrc } from "./section-src";
import { SectionBill } from "./section-bill";
import { SectionPub } from "./section-pub";
import { SectionLook } from "./section-look";
import { SectionMedia } from "./section-media";
import { CoverPreview } from "./cover-preview";

/**
 * Мэдээ бэлтгэх форм — admin.html-ийн `#v-edit`.
 *
 * Төлөв нь НЭГ reducer-т: хавтасны урьдчилан харалт бүх талбараас
 * хамаардаг тул хэсэг бүр өөрийн `useState` баривал урьдчилан харалт
 * хоцорно.
 *
 * Эрхгүй хэсгийг ОГТ ЗУРАХГҮЙ — түгжсэн талбар нь дарж болохгүй
 * товчтой адил. Сервер нь мөн адил шалгана (`pickEditable`): энд
 * нуух нь зөвхөн ойлгомжтой байхын тул.
 */
export function EditorForm({
  actor,
  post,
  categories,
  today,
}: {
  actor: Actor;
  post: StudioPostFull | null;
  categories: string[];
  today: string;
}) {
  const router = useRouter();

  const initial = useMemo<EditorState>(
    () => (post ? editorFromPost(post) : emptyEditor(today)),
    [post, today],
  );

  const [state, dispatch] = useReducer(editorReducer, initial);
  const [saved, setSaved] = useState<EditorState>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [autoFormat, setAutoFormat] = useState(true);

  const dirty = isDirty(saved, state);

  const ref = {
    id: post?.id ?? null,
    status: post?.status ?? ("DRAFT" as const),
    authorId: post?.authorId ?? actor.userId,
  };
  const allowed = new Set<PermSection>(sectionsFor(actor, ref));

  /**
   * Эхний зураг нь хавтас болно — admin.html-ийн «эхний зураг ном
   * хавтас болно». Зураг оруулах нь Task 10, тэр хүртэл хээ зурагдана.
   */
  const coverImage = post?.media.find((m) => m.kind === "image")?.url ?? null;

  /**
   * Хадгалаагүй өөрчлөлттэй хуудас орхиход хөтөч сэрэмжлүүлнэ.
   * admin.html нь өөрийн харилцах цонхоор асуудаг; хөтчийнх нь
   * найдвартай — таб хаах, буцах товч, цонх хаах бүгдийг барина.
   */
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    addEventListener("beforeunload", warn);
    return () => removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useCallback(async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await trpc.studioNews.save.mutate(editorToInput(state, [...allowed]));

      if (res.dropped.length > 0) {
        setNotice(`Эрх хүрэхгүй тул хадгалаагүй талбар: ${res.dropped.join(", ")}`);
      }

      /**
       * Серверээс ирсэн шинэ `updatedAt`-ийг төлөвт тавина. Үгүй бол
       * дараагийн хадгалалт хуучин тэмдгээ илгээж, «өөр хүн засаж
       * өөрчлөгдсөн» гэсэн ХУУРАМЧ зөрчил авна — нэг хуудас ачаалалтад
       * ганц л удаа хадгалж болдог болно.
       */
      const next = editorReducer(state, {
        type: "saved",
        id: res.id,
        updatedAt: res.updatedAt,
      });
      dispatch({ type: "saved", id: res.id, updatedAt: res.updatedAt });
      setSaved(next);

      if (!post) {
        /** Шинэ мэдээ — өөрийн хаяг руу шилжинэ, дахин үүсгэхгүй */
        router.replace(`/studio/news/${res.id}`);
      } else {
        router.refresh();
      }
    } catch (e) {
      setError(trpcMessage(e));
    } finally {
      setBusy(false);
    }
  }, [state, post, router]);

  const canSave = state.title.trim().length > 0 && !busy;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) void save();
      }}
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="font-head text-[26px] font-bold leading-tight tracking-tight md:text-[30px]">
          {post ? "Мэдээ засах" : "Шинэ мэдээ"}
        </h1>
        <Link
          href="/studio/news"
          className="font-head text-sm font-semibold text-muted hover:text-ink"
        >
          ← Жагсаалт
        </Link>
      </div>

      <FlowBar status={ref.status} reviewNote={post?.reviewNote ?? null} />

      {/*
        Хоёр багана: зүүн талд форм, баруун талд ном. Урьдчилан харалт нь
        наалддаг тул гүйлгэх үед ч харагдана — редактор бичих бүртээ
        үр дүнг нь хардаг.
      */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0">
          {allowed.has("basic") ? (
            <SectionBasic
              state={state}
              dispatch={dispatch}
              categories={categories}
              autoFormat={autoFormat}
              onAutoFormatChange={setAutoFormat}
            />
          ) : null}

          {allowed.has("photos") ? (
            <SectionMedia postId={post?.id ?? null} media={post?.media ?? []} kind="image" />
          ) : null}

          {allowed.has("video") ? (
            <SectionMedia postId={post?.id ?? null} media={post?.media ?? []} kind="video" />
          ) : null}

          {allowed.has("look") ? (
            <SectionLook state={state} dispatch={dispatch} imageUrl={coverImage} />
          ) : null}

          {allowed.has("bill") ? <SectionBill state={state} dispatch={dispatch} /> : null}

          {allowed.has("src") ? <SectionSrc state={state} dispatch={dispatch} /> : null}

          {allowed.has("pub") ? (
            <SectionPub state={state} dispatch={dispatch} actor={actor} />
          ) : null}
        </div>

        {/* Хавтсыг ХЭНД Ч харуулна — засах эрхгүй ч юу нийтлэгдэхийг харах нь зөв */}
        <div className="order-first lg:order-none">
          <CoverPreview state={state} imageUrl={coverImage} />
        </div>
      </div>

      {allowed.size === 0 ? (
        <p className="rounded-[14px] border border-line bg-pan px-4 py-8 text-center font-head text-sm text-muted">
          Та энэ мэдээг ХАРАХ эрхтэй ч засах эрхгүй байна.
        </p>
      ) : null}

      {/* Үйлдлийн мөр — admin.html-ийн `.actbar`, доод ирмэгт наалдана */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 bg-gradient-to-t from-paper via-paper/90 to-transparent py-3">
        {allowed.size > 0 ? (
          <button
            type="submit"
            disabled={!canSave}
            className="h-11 rounded-lg bg-cob px-5 font-head text-base font-bold text-white disabled:opacity-60"
          >
            {busy ? "Хадгалж байна…" : "Хадгалах"}
          </button>
        ) : null}

        {dirty ? (
          <span className="font-head text-[13px] font-semibold text-warn">
            Хадгалаагүй өөрчлөлт байна
          </span>
        ) : post ? (
          <span className="font-head text-[13px] text-muted">Бүх өөрчлөлт хадгалагдсан</span>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="font-head text-[13px] font-semibold text-[#c0392b]">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="font-head text-[13px] font-semibold text-warn">
          {notice}
        </p>
      ) : null}
    </form>
  );
}
