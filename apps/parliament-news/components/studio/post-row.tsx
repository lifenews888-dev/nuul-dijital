import Link from "next/link";
import type { StudioPost } from "../../lib/studio-posts";
import { postBadge, mnAgoShort } from "../../lib/studio-status";
import { mnNumericDate } from "../../lib/format";
import { sectionsFor, canDelete, type Actor } from "../../lib/permissions";
import { actionsFor } from "../../lib/workflow-actions";
import { WorkflowButtons } from "./workflow-buttons";
import { DeleteButton } from "./delete-button";

/**
 * Мэдээний нэг мөр — admin.html-ийн `.nr`.
 *
 * Товчны ТЕКСТ нь эрхээс хамаарна: засах хэсэггүй хүнд «Харах» гэж гарна.
 * Энэ нь хамгаалалт БИШ (сервер өөрөө шалгана) — харин «Засах» гэж дараад
 * бүх талбар нь түгжээтэй хуудас үзэхээс хамгаална.
 */
export function PostRow({ post, actor }: { post: StudioPost; actor: Actor }) {
  const ref = { id: post.id, status: post.status, authorId: post.authorId };
  const editable = sectionsFor(actor, ref).length > 0;
  /**
   * Шошго нь ТӨЛӨВ биш, «сайтад байгаа эсэх»: ирээдүйн огноотой мэдээ
   * нь `PUBLISHED` атлаа уншигчид харагдахгүй.
   */
  const badge = postBadge(post);

  return (
    <article className="grid grid-cols-1 items-start gap-3 border-t border-line px-3.5 py-3 first:border-t-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-[18px] md:py-3.5">
      <div className="min-w-0">
        <Link
          href={`/studio/news/${post.id}`}
          className="font-head text-[15px] font-semibold text-ink hover:underline"
        >
          {post.title || "(гарчиггүй)"}
        </Link>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-head text-[12.5px] text-muted">
          {/* Өнгө нь app/studio.css-д `[data-status]`-аар */}
          <span data-status={badge.kind}>{badge.label}</span>
          {post.categoryName ? <span>{post.categoryName}</span> : null}
          <span>{mnNumericDate(post.date)}</span>
          {post.authorName ? <span>{post.authorName}</span> : null}
          <span>{mnAgoShort(post.updatedAt)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-end gap-2">
        <WorkflowButtons postId={post.id} actions={actionsFor(actor, ref)} />

        <Link
          href={`/studio/news/${post.id}`}
          className="flex h-9 shrink-0 items-center rounded-lg border border-line bg-pan px-3 font-head text-[13px] font-semibold text-ink hover:bg-soft"
        >
          {editable ? "Засах" : "Харах"}
        </Link>

        {canDelete(actor, ref) ? <DeleteButton postId={post.id} title={post.title} /> : null}
      </div>
    </article>
  );
}
