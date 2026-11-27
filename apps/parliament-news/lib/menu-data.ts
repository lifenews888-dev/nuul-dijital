import { requireTenant } from "./tenant";
import { forTenant } from "./tenant-db";
import { publishedWhere } from "./posts";
import type { MenuPost } from "./menu-filter";

/**
 * Цэсний өгөгдөл — НИЙТИЙН гадаргуу.
 *
 * `publishedWhere()` нь ЗААВАЛ: цэс бол уншигчийн хэрэгсэл, ноорог,
 * цаг товлосон мэдээ энд гарах ёсгүй. Студийн жагсаалт (`studio-posts.ts`)
 * яг эсрэг дүрэмтэй — хоёрыг хольвол уншигчид ноорог харагдана.
 *
 * Яагаад урьдчилж татдаг вэ: artifact нь бүх мэдээг санах ойд хадгалж,
 * бичих болгонд агшин зуур шүүдэг. Бид өгөгдлийн сантай тул бүгдийг нь
 * татаж чадахгүй; оронд нь сүүлийн `MENU_MAX`-ийг татаад хөтөч дээр
 * шүүнэ. Хайлт нь түүнээс цааш явбал «Бүх мэдээнээс хайх» нь `/search`
 * руу хөтөлнө — цэс нь «олдсонгүй» гэж ХУДАЛ хэлэхгүй.
 */

/** Цэс хэдэн мэдээг урьдчилж татах вэ */
export const MENU_MAX = 60;

export type MenuData = {
  posts: MenuPost[];
  /** Ангиллын дараалал — тохиргооных */
  order: string[];
};

export async function menuData(): Promise<MenuData> {
  const tenant = await requireTenant();
  const db = forTenant(tenant.id);

  const [rows, categories] = await Promise.all([
    db.newsPost.findMany({
      where: publishedWhere(),
      orderBy: { date: "desc" },
      take: MENU_MAX,
      select: {
        slug: true,
        title: true,
        lead: true,
        date: true,
        tags: true,
        category: { select: { name: true } },
        bill: { select: { stage: true } },
        media: { where: { kind: "video" }, select: { id: true }, take: 1 },
      },
    }),
    db.newsCategory.findMany({ select: { name: true }, orderBy: { order: "asc" } }),
  ]);

  return {
    posts: rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      lead: r.lead,
      category: r.category?.name ?? null,
      date: r.date,
      hasVideo: r.media.length > 0,
      billStage: r.bill?.stage ?? null,
      tags: r.tags,
    })),
    order: categories.map((c) => c.name),
  };
}
