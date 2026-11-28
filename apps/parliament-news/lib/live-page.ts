import { requireTenant } from "./tenant";
import { forTenant } from "./tenant-db";
import { ubToday } from "./format";
import { publishedWhere, PUBLIC_LIST, toListItem, type PostListItem, type PostRow } from "./posts";
import type { LiveInfo } from "./home-data";

/**
 * `/live` хуудасны өгөгдөл.
 *
 * `homeData()`-г дахин хэрэглэхгүй: тэр нь тавиурын 12 мэдээ, стори,
 * онцлох, хуулийн төслүүдийг бүгдийг татдаг бөгөөд эндээс нэг нь ч
 * хэрэггүй. Шууд дамжуулалтын хуудас нь чуулган явж байх үед хамгийн их
 * ачаалал авна — тэр мөчид илүү уншилт хийх нь хамгийн муу үе.
 */
export type LivePage = {
  live: LiveInfo | null;
  agenda: { time: string; text: string }[];
  /** Сүүлийн видео мэдээ — дамжуулалт байхгүй үед ч хуудас хоосон үлдэхгүй */
  videos: PostListItem[];
};

const VIDEO_TAKE = 6;

export async function livePage(): Promise<LivePage> {
  const tenant = await requireTenant();
  const db = forTenant(tenant.id);
  const today = ubToday();

  const [live, agenda, videoRows] = await Promise.all([
    db.liveState.findFirst({}),
    db.agenda.findMany({ where: { date: today }, orderBy: { order: "asc" } }),
    db.newsPost.findMany({
      where: { ...publishedWhere(), category: { slug: "video" } },
      ...PUBLIC_LIST,
      take: VIDEO_TAKE,
    }),
  ]);

  return {
    live: live
      ? {
          attendance: live.attendance,
          sessionStatus: live.sessionStatus,
          tickerOn: live.tickerOn,
          liveOn: live.liveOn,
          liveUrl: live.liveUrl,
          liveTitle: live.liveTitle,
          breakingOn: live.breakingOn,
          breakingText: live.breakingText,
          breakingSlug: null,
        }
      : null,
    agenda: agenda.map((a) => ({ time: a.time, text: a.text })),
    videos: (videoRows as PostRow[]).map(toListItem),
  };
}
