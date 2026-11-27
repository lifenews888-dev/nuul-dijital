import { requireTenant } from "./tenant";
import { forTenant } from "./tenant-db";
import { getSetting } from "./settings";
import { validFx, weatherView, type FxRow, type WeatherView } from "./info";

/**
 * Нийтийн талын цаг агаар ба ханш.
 *
 * `homeData`-д нэгтгээгүй нь зориуд: цэс нь БҮХ хуудсанд (layout-д) зурагддаг
 * бөгөөд нүүрний өгөгдөл түүнд хэрэггүй. Тусдаа байх нь хоёр хэрэглэгч тус
 * бүр өөрт хэрэгтэйг нь л татна.
 *
 * Гурван уншилт, бүгд жижиг: нэг тохиргооны мөр, нэг тохиргооны мөр, зургаан
 * ханшийн мөр. Хуудас нь `revalidate`-тай тул ачаалал бүрт биш.
 */
export type SiteInfo = {
  weather: WeatherView | null;
  fx: FxRow[];
  /** «Ханш: …» мөрөнд гарах эх сурвалж. Хоосон бол «Монголбанк». */
  fxSource: string;
  /** Ханш хамгийн сүүлд шинэчлэгдсэн огноо */
  at: Date | null;
};

export async function siteInfo(): Promise<SiteInfo> {
  const tenant = await requireTenant();
  const db = forTenant(tenant.id);

  const [weather, feed, rows] = await Promise.all([
    getSetting(db, "weather"),
    getSetting(db, "feed"),
    db.fxRate.findMany({ orderBy: { order: "asc" } }),
  ]);

  /**
   * `Decimal` нь JS-ийн тоо БИШ: `Number.isFinite(decimal)` нь үргэлж худал
   * тул `validFx` бүх мөрийг хаяна. Хөрвүүлэлт ЭНД, нэг л газарт.
   */
  const fx = validFx(
    rows.map((r) => ({
      code: r.code,
      value: Number(r.value),
      change: Number(r.change),
    })),
  );

  const at = rows.reduce<Date | null>(
    (latest, r) => (latest === null || r.updatedAt > latest ? r.updatedAt : latest),
    null,
  );

  return { weather: weatherView(weather), fx, fxSource: feed.fxSource, at };
}
