import type { NewsStatus } from "@nuul/db-news";
import { forTenant } from "./tenant-db";

/**
 * Засварлагчийн УНШИЛТ — формд хэрэгтэй бүх зүйл нэг дуудлагаар.
 *
 * Нийтийн `postBySlug` нь `publishedWhere()`-ээр явдаг: редакторт тэр
 * хаалга хэрэггүй, ноорог, буцаасан, цаг товлосон бүгдийг нээх ёстой.
 * `forTenant`-ийн хаалга харин ХЭВЭЭР.
 */

export type StudioMedia = {
  id: string;
  url: string;
  kind: string;
  caption: string | null;
  order: number;
};

export type StudioBillStep = { index: number; note: string | null };

export type StudioBill = {
  stage: number;
  votesYes: number;
  votesNo: number;
  steps: StudioBillStep[];
};

export type StudioPostFull = {
  id: string;
  slug: string;
  status: NewsStatus;
  authorId: string | null;
  title: string;
  kicker: string | null;
  lead: string | null;
  body: string | null;
  categoryName: string | null;
  subcategory: string | null;
  date: Date;
  reporter: string | null;
  tags: string[];
  sources: string[];
  motif: string;
  theme: number;
  look: unknown;
  channels: string[];
  featured: boolean;
  story: boolean;
  storyUrl: string | null;
  storyUntil: Date | null;
  publishedAt: Date | null;
  /** Сторины сонгосон хугацааг сэргээхэд — `storyUntil - createdAt` */
  createdAt: Date;
  /** Зэрэгцээ засварлалт илрүүлэхэд — формоос буцаж ирнэ */
  updatedAt: Date;
  reviewNote: string | null;
  media: StudioMedia[];
  bill: StudioBill | null;
};

export async function studioPost(
  tenantId: string,
  id: string,
): Promise<StudioPostFull | null> {
  const row = await forTenant(tenantId).newsPost.findFirst({
    where: { id },
    select: {
      id: true,
      slug: true,
      status: true,
      authorId: true,
      title: true,
      kicker: true,
      lead: true,
      body: true,
      subcategory: true,
      date: true,
      reporter: true,
      tags: true,
      sources: true,
      motif: true,
      theme: true,
      look: true,
      channels: true,
      featured: true,
      story: true,
      storyUrl: true,
      storyUntil: true,
      publishedAt: true,
      createdAt: true,
      updatedAt: true,
      reviewNote: true,
      category: { select: { name: true } },
      media: {
        orderBy: { order: "asc" },
        select: { id: true, url: true, kind: true, caption: true, order: true },
      },
      bill: {
        select: {
          stage: true,
          votesYes: true,
          votesNo: true,
          /** Схемд харьцааны нэр нь `stages` — `steps` нь artifact-ийн үг */
          stages: { orderBy: { index: "asc" }, select: { index: true, note: true } },
        },
      },
    },
  });

  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    authorId: row.authorId,
    title: row.title,
    kicker: row.kicker,
    lead: row.lead,
    body: row.body,
    categoryName: row.category?.name ?? null,
    subcategory: row.subcategory,
    date: row.date,
    reporter: row.reporter,
    tags: row.tags,
    sources: row.sources,
    motif: row.motif,
    theme: row.theme,
    look: row.look,
    channels: row.channels,
    featured: row.featured,
    story: row.story,
    storyUrl: row.storyUrl,
    storyUntil: row.storyUntil,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    reviewNote: row.reviewNote,
    media: row.media,
    bill: row.bill
      ? {
          stage: row.bill.stage,
          votesYes: row.bill.votesYes,
          votesNo: row.bill.votesNo,
          steps: row.bill.stages,
        }
      : null,
  };
}

/** Ангиллын нэрс — формын `<select>`-д, тохиргооны дарааллаар */
export async function studioCategories(tenantId: string): Promise<string[]> {
  const rows = await forTenant(tenantId).newsCategory.findMany({
    select: { name: true },
    orderBy: { order: "asc" },
  });
  return rows.map((r) => r.name);
}
