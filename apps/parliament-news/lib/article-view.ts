import { listPosts, type PostFull, type PostListItem } from "./posts";
import { requireTenant } from "./tenant";
import { forTenant } from "./tenant-db";
import { relatedScore, type RelatedFacts } from "./reading";

/**
 * Нийтлэлийн хуудсын НЭМЭЛТ өгөгдөл — хуулийн төслийн явц, дараагийн мэдээ,
 * санал болгох мэдээ, уншигчдын сэтгэгдэл.
 *
 * `postBySlug`-д нэгтгээгүй нь зориуд: RSS, sitemap, OG зураг, хайлт
 * бүгд `PostFull` уншдаг бөгөөд тэдэнд эдгээрийн нэг нь ч хэрэггүй.
 * Нэгтгэвэл мэдээний жагсаалт бүр хуулийн шат, сэтгэгдлийг дагуулж татна.
 */

/** Хэдэн мэдээнээс санал болгохыг сонгох вэ. Artifact нь БҮХ мэдээг үздэг. */
const POOL = 40;
const COMMENT_MAX = 50;

export type BillStep = {
  index: number;
  date: Date | null;
  note: string | null;
  sources: string[];
};

export type BillView = {
  stage: number;
  votesYes: number;
  votesNo: number;
  /** Зөвхөн РЕДАКЦ БИЧСЭН шатууд. Бичээгүй нь энд БАЙХГҮЙ, 5 нүд үргэлж зурагдана. */
  steps: BillStep[];
};

export type PublicComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
};

export type ArticleView = {
  bill: BillView | null;
  next: PostListItem | null;
  related: PostListItem[];
  comments: PublicComment[];
};

function facts(post: PostListItem, hasBill: boolean): RelatedFacts {
  return {
    categorySlug: post.categorySlug,
    hasBill,
    featured: post.featured,
    date: post.publishedAt,
  };
}

export async function articleView(
  post: PostFull,
  now: Date = new Date(),
): Promise<ArticleView> {
  const tenant = await requireTenant();
  const db = forTenant(tenant.id);

  const [billRow, comments, pool] = await Promise.all([
    db.bill.findFirst({
      where: { post: { slug: post.slug } },
      include: { stages: { orderBy: { index: "asc" } } },
    }),
    db.newsComment.findMany({
      where: { post: { slug: post.slug }, hidden: false },
      orderBy: { createdAt: "desc" },
      take: COMMENT_MAX,
      select: { id: true, authorName: true, body: true, createdAt: true },
    }),
    listPosts({ take: POOL }),
  ]);

  /**
   * Хөрш мэдээнүүдийн хуулийн төсөлтэй эсэх. `PostListItem`-д `id` байхгүй
   * тул slug-аар — нэг нэмэлт уншилт, N+1 биш.
   */
  const others = pool.filter((p) => p.slug !== post.slug);
  const billed = others.length
    ? new Set(
        (
          await db.bill.findMany({
            where: { post: { slug: { in: others.map((p) => p.slug) } } },
            select: { post: { select: { slug: true } } },
          })
        )
          .map((b) => b.post?.slug)
          .filter((s): s is string => Boolean(s)),
      )
    : new Set<string>();

  /**
   * Дараагийн мэдээ — artifact-ийн `(i+1)%L`: жагсаалтын дараагийнх, төгсгөлд
   * хүрвэл эхэнд эргэнэ. Мэдээ нь pool-д байхгүй бол (40-өөс хуучин) хамгийн
   * шинэ мэдээ рүү чиглүүлнэ: уншигч мухардахгүй.
   */
  const here = pool.findIndex((p) => p.slug === post.slug);
  const next =
    here < 0 ? (others[0] ?? null) : (pool[here + 1] ?? others[0] ?? null);

  const self = facts(post, billRow !== null);
  const related = others
    .filter((p) => p.slug !== next?.slug)
    .map((p) => ({ p, score: relatedScore(self, facts(p, billed.has(p.slug)), now) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((o) => o.p);

  return {
    bill: billRow
      ? {
          stage: billRow.stage,
          votesYes: billRow.votesYes,
          votesNo: billRow.votesNo,
          steps: billRow.stages.map((s) => ({
            index: s.index,
            date: s.date,
            note: s.note,
            sources: s.sources,
          })),
        }
      : null,
    next,
    related,
    comments,
  };
}
