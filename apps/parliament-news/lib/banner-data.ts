import { requireTenant } from "./tenant";
import { forTenant } from "./tenant-db";
import { visibleBanners, type AdItem, type Placement } from "./banner";

/**
 * Нийтийн талын баннерууд.
 *
 * Шүүлтийг САНД биш JS-д хийнэ: мөрийн тоо цөөн (зарын талбай гурав,
 * идэвхтэй зар арав хүрэхгүй) бөгөөд `visibleBanners` нь цэвэр тестээр
 * бүрэн баригдсан. SQL-д хуулбарлавал хоёр газар зөрөх эрсдэлтэй.
 */
export async function banners(place: Placement, now: Date = new Date()): Promise<AdItem[]> {
  const tenant = await requireTenant();
  const rows = await forTenant(tenant.id).banner.findMany({ orderBy: { order: "asc" } });
  return visibleBanners(rows, place, now);
}
