import type { NewsStatus, Prisma } from "@nuul/db-news";
import { forTenant } from "./tenant-db";
import { escapeLike, searchTerm } from "./posts";
import type { Actor } from "./permissions";

/**
 * РЕДАКЦЫН мэдээний жагсаалт.
 *
 * `lib/posts.ts`-ийн `publishedWhere()`-ийг ЭНД ХЭРЭГЛЭХГҮЙ: тэр нь ноорог,
 * хянагдаж буй, цаг товлосон мэдээг хасдаг — уншигчид тэднийг харах ёсгүй.
 * Редакц нь яг тэднийг харах ёстой, тэд л ажил юм.
 *
 * `forTenant`-ийн хаалга нь ХЭВЭЭР: нэг сайтын редактор нөгөөгийн ноорогийг
 * харах шалтгаан байхгүй.
 */

/** Нэг хуудсанд хэдэн мөр. Эрэмбэ нь `updatedAt desc` тул дээд нь шинэ. */
export const STUDIO_LIST_MAX = 100;

export const ALL_STATUSES: NewsStatus[] = [
  "DRAFT",
  "REVIEW",
  "APPROVED",
  "PUBLISHED",
  "RETURNED",
];

export type StudioFilter = {
  status?: NewsStatus | "all";
  q?: string;
  mine?: boolean;
};

export type StudioPost = {
  id: string;
  slug: string;
  title: string;
  status: NewsStatus;
  categoryName: string | null;
  authorId: string | null;
  authorName: string | null;
  date: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

const LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  status: true,
  authorId: true,
  date: true,
  updatedAt: true,
  publishedAt: true,
  category: { select: { name: true } },
  author: { select: { name: true } },
} satisfies Prisma.NewsPostSelect;

type ListRow = Prisma.NewsPostGetPayload<{ select: typeof LIST_SELECT }>;

function toStudioPost(row: ListRow): StudioPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    categoryName: row.category?.name ?? null,
    authorId: row.authorId,
    authorName: row.author?.name ?? null,
    date: row.date,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
  };
}

function listWhere(actor: Actor, filter: StudioFilter): Prisma.NewsPostWhereInput {
  const where: Prisma.NewsPostWhereInput = {};

  if (filter.status && filter.status !== "all") {
    where.status = filter.status;
  }

  if (filter.mine) {
    where.authorId = actor.userId;
  }

  /**
   * `searchTerm` нь хоосон, хэт урт үгийг хаяна; `escapeLike` нь `%`, `_`-г
   * энгийн тэмдэгт болгоно. Хоёрыг хамт хэрэглэхгүй бол `?q=%` нь бүх
   * мэдээг буцаана.
   */
  const q = searchTerm(filter.q);
  if (q) {
    where.title = { contains: escapeLike(q), mode: "insensitive" };
  }

  return where;
}

export async function studioPosts(
  tenantId: string,
  actor: Actor,
  filter: StudioFilter,
): Promise<StudioPost[]> {
  const rows = await forTenant(tenantId).newsPost.findMany({
    where: listWhere(actor, filter),
    select: LIST_SELECT,
    orderBy: { updatedAt: "desc" },
    take: STUDIO_LIST_MAX,
  });

  return rows.map(toStudioPost);
}

/**
 * Төлөв бүрийн тоо — дээрх чипүүдэд.
 *
 * Таван төлөв БҮГД гарна, нэг ч мэдээгүй төлөв нь 0 болж. `groupBy` нь
 * хоосон төлөвийг буцаадаггүй тул тэднийг нөхөхгүй бол чип нь гэнэт
 * алга болж, редактор «Буцаасан» гэсэн шүүлтүүрийг олохгүй.
 */
export async function studioCounts(
  tenantId: string,
  actor: Actor,
  filter: Omit<StudioFilter, "status"> = {},
): Promise<Record<NewsStatus, number>> {
  const groups = await forTenant(tenantId).newsPost.groupBy({
    by: ["status"],
    where: listWhere(actor, filter),
    _count: { _all: true },
  });

  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<
    NewsStatus,
    number
  >;

  for (const g of groups) {
    counts[g.status] = g._count._all;
  }

  return counts;
}
