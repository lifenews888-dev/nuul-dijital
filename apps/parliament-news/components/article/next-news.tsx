import Link from "next/link";
import { coverUrl } from "../../lib/cover-input";
import { mnNumericDate } from "../../lib/format";
import type { PostListItem } from "../../lib/posts";

/**
 * Дараагийн ба санал болгох мэдээ — artifact-ийн `renderNx()`.
 *
 * Хавтсыг `<img src="/cover/…">`-ээр: дөрвөн хавтсыг inline SVG-гээр тавибал
 * нийтлэлийн HTML ~12 КБ нэмэгдэнэ, харин хаягаар авбал CDN-д кэшлэгдэж,
 * жагсаалтын хуудсууд нь аль хэдийн татсан байдаг.
 */
function Card({ post, big }: { post: PostListItem; big?: boolean }) {
  return (
    <Link className={`nxb${big ? " big" : ""}`} href={`/news/${post.slug}`}>
      <i>
        <img src={coverUrl(post.slug)} alt="" width={474} height={620} loading="lazy" />
      </i>
      <span>
        <b>{post.title}</b>
        <small>
          {mnNumericDate(post.date)} · {post.categoryName}
        </small>
      </span>
    </Link>
  );
}

export function NextNews({
  next,
  related,
}: {
  next: PostListItem | null;
  related: PostListItem[];
}) {
  if (!next && related.length === 0) return null;

  return (
    <>
      {next ? (
        <>
          <div className="nxh">Дараагийн мэдээ →</div>
          <Card post={next} big />
        </>
      ) : null}
      {related.length > 0 ? (
        <>
          <div className="nxh" style={{ marginTop: 16 }}>
            Санал болгох мэдээ
          </div>
          {related.map((p) => (
            <Card key={p.slug} post={p} />
          ))}
        </>
      ) : null}
    </>
  );
}
