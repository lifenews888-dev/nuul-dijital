import { commentAgo } from "../../lib/reading";
import type { PublicComment } from "../../lib/article-view";

/**
 * Уншигчдын сэтгэгдэл — ЗӨВХӨН ХАРУУЛНА.
 *
 * Бичих форм зориуд байхгүй: нийтийн бичих зам нь хурдны хязгаар, уртын
 * хязгаар, бот хамгаалалт, зүй бус агуулгын журам шаардана. Студид
 * модерацын хэрэгсэл бэлэн тул редакц сэтгэгдлийг оруулж, нуух боломжтой;
 * нийтийн форм нь тусдаа шийдвэр.
 */
export function Comments({ comments }: { comments: PublicComment[] }) {
  return (
    <>
      <div className="nxh">Сэтгэгдэл ({comments.length})</div>
      {comments.length === 0 ? (
        <div className="cmo">Сэтгэгдэл хараахан алга.</div>
      ) : (
        <ul className="m-0 list-none p-0">
          {comments.map((c) => (
            <li key={c.id} className="border-t border-rule/15 py-2.5 first:border-t-0 first:pt-0">
              <b className="font-head text-[13.5px] font-semibold">{c.authorName}</b>
              <span className="ml-2 font-head text-[12px] text-muted">
                {commentAgo(c.createdAt)}
              </span>
              <p className="mt-1 whitespace-pre-line font-title text-[14.5px] leading-relaxed">
                {c.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
