/**
 * Нийтийн уншилтын ЦОРЫН ГАГЦ хаалга.
 *
 * Хуудас бүр өөрийн `where` бичихийг зөвшөөрөхгүй: нийтлээгүй мэдээ харагдахгүй
 * гэдэг нь энэ шатны гол хамгаалалт тул нөхцөл нь нэг газар — `publishedWhere()`.
 * Шинэ нийтийн жагсаалт нэмэх бол энд функц нэмнэ, хуудсанд Prisma дуудахгүй.
 *
 * Tenant: функц бүр `requireTenant()` → `forTenant()`-аар дамжина, тул
 * `tenantId`-г мартах боломжгүй. `prisma`-г шууд импортлохгүй.
 *
 * КЭШ: `unstable_cache`-ийг энд ХЭРЭГЛЭХГҮЙ, кэшийн таг ч тодорхойлохгүй.
 * Шинэлэг байдлын цорын гагц механизм нь хуудас бүрийн `revalidate = 300`.
 * Дизайн бичиг «нийтлэхэд revalidateTag» гэдэг ч Next-д тэр нь ЗӨВХӨН
 * `unstable_cache(..., { tags })`-ээр тагласан бичлэгийг хүчингүй болгодог —
 * тагтай бичлэг байхгүй үед чимээгүй юу ч хийхгүй. Тиймээс таг ба түүнийг
 * дуудах код (CMS-ийн нийтлэх үйлдэл) 3-р шатанд ХАМТДАА орно; эс бөгөөс
 * энд байхгүй баталгааг байгаа мэт харуулсан хэрэглэгддэггүй тогтмол үлдэнэ.
 */
import type { Prisma } from "@nuul/db-news";
import { forTenant } from "./tenant-db";
import { requireTenant } from "./tenant";
import { parseLook, type CoverLook } from "./cover";

/** Хайлтын үгийн дээд урт. Үүнээс урт бол хайлт хийхгүй. */
export const SEARCH_MAX = 200;

/** Нийтэд харагдах мэдээний нөхцөл: нийтлэгдсэн БА цаг нь болсон. */
export function publishedWhere(now: Date = new Date()): {
  status: "PUBLISHED";
  publishedAt: { not: null; lte: Date };
} {
  return { status: "PUBLISHED", publishedAt: { not: null, lte: now } };
}

/** Хайлтын үгийг цэвэрлэнэ. Хоосон эсвэл хэт урт бол null — хайлт хийхгүй. */
export function searchTerm(raw: string | undefined | null): string | null {
  const q = (raw ?? "").trim();
  if (!q || q.length > SEARCH_MAX) return null;
  return q;
}

/**
 * LIKE/ILIKE-ийн орлуулагчийг энгийн тэмдэгт болгоно.
 *
 * Prisma-ийн `contains` нь утгыг `%…%` дотор хийж ILIKE болгодог ч `%`, `_`-г
 * зугтаадаггүй: `?q=%` нь БҮХ мэдээг буцааж, «хоосон хайлт бүх мэдээг
 * буцаахгүй» гэсэн баталгааг өөр хаалгаар давна.
 *
 * `\` нь ХАМГИЙН ЭХЭНД — эс бөгөөс дараа нэмэх зугтаалтын `\` өөрөө дахин
 * зугтаагдана. Харуулах үг нь эх хэвээр үлдэнэ (`searchTerm`), зөвхөн query-д
 * орох хувилбар нь зугтаана.
 */
export function escapeLike(term: string): string {
  return term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

const CATEGORY_SELECT = { select: { slug: true, name: true } } as const;
const MEDIA_SELECT = {
  select: { url: true, caption: true },
  orderBy: { order: "asc" },
} as const;

/** Жагсаалтад: хавтасны зураг нэг л хэрэгтэй */
const LIST_INCLUDE = {
  category: CATEGORY_SELECT,
  media: { ...MEDIA_SELECT, take: 1 },
} satisfies Prisma.NewsPostInclude;

/** Нийтлэлийн хуудсанд: бүх медиа */
const FULL_INCLUDE = {
  category: CATEGORY_SELECT,
  media: MEDIA_SELECT,
} satisfies Prisma.NewsPostInclude;

/** Prisma-ийн буцаах мөр. Схем өөрчлөгдвөл энд төрлийн алдаа болж харагдана. */
export type PostRow = Prisma.NewsPostGetPayload<{ include: typeof FULL_INCLUDE }>;

/**
 * ХАВТГАЙ төрөл, Prisma-ийн include-ийн бүтэц биш: cover.ts, shelf-model.ts,
 * post-card.tsx, rss/sitemap дөрвүүлэн нэг хэлбэрийг хүлээнэ.
 */
export type PostListItem = {
  slug: string;
  title: string;
  kicker: string | null;
  lead: string | null;
  date: Date;
  publishedAt: Date;
  updatedAt: Date;
  categorySlug: string | null;
  categoryName: string;
  tags: string[];
  reporter: string | null;
  motif: string;
  theme: number;
  look: CoverLook | null;
  imageUrl: string | null;
  featured: boolean;
};

export type PostFull = PostListItem & {
  body: string | null;
  sources: string[];
  media: { url: string; caption: string | null }[];
};

/** Ангилалгүй мэдээний хавтсанд бичих нэр */
const NO_CATEGORY = "Мэдээ";

/** Prisma-ийн мөрийг PostListItem болгоно — ЦОРЫН ГАГЦ хөрвүүлэх газар. */
export function toListItem(row: PostRow): PostListItem {
  if (!row.publishedAt) {
    // Хаалга нь publishedAt: { not: null } шүүдэг тул энд хүрэх боломжгүй.
    // Хүрсэн бол хэн нэг нь хаалгыг тойрсон гэсэн үг — чимээгүй өнгөрүүлэхгүй.
    throw new Error(`"${row.slug}" нийтлэгдсэн гэж ирсэн ч publishedAt хоосон байна`);
  }
  return {
    slug: row.slug,
    title: row.title,
    kicker: row.kicker,
    lead: row.lead,
    date: row.date,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    categorySlug: row.category?.slug ?? null,
    categoryName: row.category?.name ?? NO_CATEGORY,
    tags: row.tags,
    reporter: row.reporter,
    motif: row.motif,
    theme: row.theme,
    look: parseLook(row.look),
    imageUrl: row.media[0]?.url ?? null,
    featured: row.featured,
  };
}

function toFull(row: PostRow): PostFull {
  return {
    ...toListItem(row),
    body: row.body,
    sources: row.sources,
    media: row.media,
  };
}

/** Tenant-д хаагдсан клиент */
async function gate() {
  const tenant = await requireTenant();
  return forTenant(tenant.id);
}

type ListFilter = {
  categorySlug?: string;
  tag?: string;
  q?: string;
  featured?: boolean;
};

function listWhere(filter: ListFilter): Prisma.NewsPostWhereInput {
  const where: Prisma.NewsPostWhereInput = { ...publishedWhere() };

  if (filter.categorySlug) where.category = { slug: filter.categorySlug };
  if (filter.tag) where.tags = { has: filter.tag };
  if (filter.featured !== undefined) where.featured = filter.featured;
  if (filter.q) {
    // Орлуулагчийг зугтаасан хувилбараар — эх үг нь зөвхөн харуулахад
    const q = escapeLike(filter.q);
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { lead: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

const NEWEST_FIRST = { publishedAt: "desc" } as const;

export async function listPosts(
  opts: { take?: number; skip?: number; featured?: boolean } = {},
): Promise<PostListItem[]> {
  const db = await gate();
  const rows = await db.newsPost.findMany({
    where: listWhere({ featured: opts.featured }),
    include: LIST_INCLUDE,
    orderBy: NEWEST_FIRST,
    take: opts.take ?? 12,
    skip: opts.skip ?? 0,
  });
  return (rows as PostRow[]).map(toListItem);
}

export async function countPosts(filter: ListFilter = {}): Promise<number> {
  const db = await gate();
  const q = filter.q === undefined ? undefined : (searchTerm(filter.q) ?? undefined);
  if (filter.q !== undefined && q === undefined) return 0;
  return db.newsPost.count({ where: listWhere({ ...filter, q }) });
}

export async function postBySlug(slug: string): Promise<PostFull | null> {
  const db = await gate();
  const row = await db.newsPost.findFirst({
    where: { ...publishedWhere(), slug },
    include: FULL_INCLUDE,
  });
  return row ? toFull(row as PostRow) : null;
}

/**
 * Хуучин хаягийг одоогийн мэдээ рүү хөрвүүлнэ.
 * Мэдээ нь нийтлэгдээгүй бол null — хуучин хаягаар ноорог руу орох зам байхгүй.
 */
export async function postIdByRedirect(
  fromSlug: string,
): Promise<{ postId: string; slug: string } | null> {
  const db = await gate();
  const hit = await db.newsSlugRedirect.findFirst({
    where: { fromSlug },
    select: { postId: true },
  });
  if (!hit) return null;

  const post = await db.newsPost.findFirst({
    where: { ...publishedWhere(), id: hit.postId },
    select: { slug: true },
  });
  return post ? { postId: hit.postId, slug: post.slug } : null;
}

async function listBy(
  filter: ListFilter,
  opts: { take: number; skip: number },
): Promise<PostListItem[]> {
  const db = await gate();
  const rows = await db.newsPost.findMany({
    where: listWhere(filter),
    include: LIST_INCLUDE,
    orderBy: NEWEST_FIRST,
    take: opts.take,
    skip: opts.skip,
  });
  return (rows as PostRow[]).map(toListItem);
}

export function postsByCategory(
  slug: string,
  opts: { take: number; skip: number },
): Promise<PostListItem[]> {
  return listBy({ categorySlug: slug }, opts);
}

export function postsByTag(
  tag: string,
  opts: { take: number; skip: number },
): Promise<PostListItem[]> {
  return listBy({ tag }, opts);
}

/** Хоосон, зөвхөн зайтай, хэт урт хайлт нь ХООСОН массив — бүх мэдээг буцаахгүй. */
export async function searchPosts(
  q: string,
  opts: { take: number; skip: number },
): Promise<PostListItem[]> {
  const term = searchTerm(q);
  if (!term) return [];
  return listBy({ q: term }, opts);
}

export async function menuCategories(): Promise<{ slug: string; name: string }[]> {
  const db = await gate();
  return db.newsCategory.findMany({
    where: { inMenu: true },
    select: { slug: true, name: true },
    orderBy: { order: "asc" },
  });
}

/** Ангилал байгаа эсэх — хуудас 404 буцаах эсэхээ үүгээр шийднэ. */
export async function categoryBySlug(
  slug: string,
): Promise<{ slug: string; name: string } | null> {
  const db = await gate();
  return db.newsCategory.findFirst({
    where: { slug },
    select: { slug: true, name: true },
  });
}

/** RSS ба sitemap-д. Цаг товлосон мэдээ энд ч орохгүй. */
export function allPublishedForFeed(limit: number): Promise<PostListItem[]> {
  return listBy({}, { take: limit, skip: 0 });
}

/** Sitemap-д: цэсэнд байгаа эсэхээс үл хамааран БҮХ ангилал */
export async function allCategories(): Promise<{ slug: string; name: string }[]> {
  const db = await gate();
  return db.newsCategory.findMany({
    select: { slug: true, name: true },
    orderBy: { order: "asc" },
  });
}
