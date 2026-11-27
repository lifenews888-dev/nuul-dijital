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
      const res = await trpc.studioNews.save.mutate(editorToInput(state));

      if (res.dropped.length > 0) {
        setNotice(`Эрх хүрэхгүй тул хадгалаагүй талбар: ${res.dropped.join(", ")}`);
      }

      setSaved(state);

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

      {allowed.has("basic") ? (
        <SectionBasic
          state={state}
          dispatch={dispatch}
          categories={categories}
          autoFormat={autoFormat}
          onAutoFormatChange={setAutoFormat}
        />
      ) : null}

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
