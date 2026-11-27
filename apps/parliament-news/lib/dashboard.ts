import { prisma } from "@nuul/db-news";
import type { NewsStatus } from "@nuul/db-news";
import { forTenant } from "./tenant-db";
import { ubToday } from "./format";
import { bucketActivity, type ChartPoint, type ChartDays } from "./dashboard-chart";
import { ALL_STATUSES } from "./studio-posts";

/**
 * Редакцын самбарын өгөгдөл — НЭГ дуудлагаар.
 *
 * Самбар нь нэвтэрмэгц гарах хуудас тул хурд чухал: бүх уншилт нэг
 * `Promise.all`-д. Тоонууд нь `count` ба `groupBy` — мөрүүдийг татаж
 * JS дээр тоолвол 90 хоногийн график хэдэн мянган мөр чирнэ.
 */

const WEEK_MS = 7 * 86_400_000;

export type DashboardData = {
  counts: Record<NewsStatus, number>;
  /** Сүүлийн 7 хоногт нийтлэгдсэн, өмнөх 7 хоногтой харьцуулсан */
  week: { now: number; before: number };
  comments: { total: number; today: number };
  media: { total: number; videos: number };
  chart: ChartPoint[];
  /** Ангиллаар — зөвхөн мэдээтэй нь */
  byCategory: { name: string; count: number }[];
  agenda: { time: string; text: string }[];
  live: {
    attendance: number;
    sessionStatus: string;
    tickerOn: boolean;
    liveOn: boolean;
    breakingOn: boolean;
  } | null;
  /** Сувгаар нийтлэгдсэн мэдээний тоо */
  channels: { name: string; count: number }[];
  team: { name: string; actions: number }[];
  /**
   * Чанарын шалгалт — нийтлэхэд бэлэн болоогүй мэдээ.
   * Товч агуулгагүй, ангилалгүй, эх сурвалжгүй нь уншигчид ч, SEO-д ч муу.
   */
  issues: { id: string; title: string; missing: string[] }[];
};

const CHANNELS = ["Сайт", "Facebook", "YouTube", "Instagram", "TikTok"];

export async function dashboardData(
  tenantId: string,
  chartDays: ChartDays = 14,
  now: Date = new Date(),
): Promise<DashboardData> {
  const db = forTenant(tenantId);
  const weekAgo = new Date(now.getTime() - WEEK_MS);
  const twoWeeksAgo = new Date(now.getTime() - 2 * WEEK_MS);
  const chartFrom = new Date(now.getTime() - chartDays * 86_400_000);
  const today = ubToday(now);

  const [
    statusGroups,
    weekNow,
    weekBefore,
    commentsTotal,
    commentsToday,
    mediaTotal,
    mediaVideos,
    activity,
    categoryGroups,
    agendaRows,
    live,
    publishedChannels,
    teamActivity,
    candidates,
  ] = await Promise.all([
    db.newsPost.groupBy({ by: ["status"], _count: { _all: true } }),
    db.newsPost.count({ where: { status: "PUBLISHED", publishedAt: { gte: weekAgo, lte: now } } }),
    db.newsPost.count({
      where: { status: "PUBLISHED", publishedAt: { gte: twoWeeksAgo, lt: weekAgo } },
    }),
    db.newsComment.count(),
    db.newsComment.count({ where: { createdAt: { gte: today } } }),
    db.newsMedia.count(),
    db.newsMedia.count({ where: { kind: "video" } }),
    db.newsActivity.findMany({
      where: { createdAt: { gte: chartFrom } },
      select: { action: true, createdAt: true },
    }),
    db.newsPost.groupBy({ by: ["categoryId"], _count: { _all: true } }),
    db.agenda.findMany({ where: { date: today }, orderBy: { order: "asc" } }),
    db.liveState.findFirst({}),
    db.newsPost.findMany({ where: { status: "PUBLISHED" }, select: { channels: true } }),
    db.newsActivity.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { userId: true },
    }),
    /**
     * Чанарын шалгалт нь НИЙТЛЭГДСЭН ба БАТЛАГДСАН дээр л утгатай:
     * ноорог дутуу байх нь хэвийн, тэр бол ажлын явц.
     */
    db.newsPost.findMany({
      where: { status: { in: ["APPROVED", "PUBLISHED"] } },
      select: { id: true, title: true, lead: true, categoryId: true, sources: true },
      take: 60,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const counts = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<
    NewsStatus,
    number
  >;
  for (const g of statusGroups) counts[g.status] = g._count._all;

  /** Ангиллын нэрийг ТУСАД нь — `groupBy` нь relation татдаггүй */
  const categoryIds = categoryGroups
    .map((g) => g.categoryId)
    .filter((id): id is string => id !== null);
  const categories = categoryIds.length
    ? await db.newsCategory.findMany({
        where: { id: { in: categoryIds } },
        select: { id: true, name: true, order: true },
        orderBy: { order: "asc" },
      })
    : [];
  const byCategory = categories.map((c) => ({
    name: c.name,
    count: categoryGroups.find((g) => g.categoryId === c.id)?._count._all ?? 0,
  }));

  const channelCount = new Map(CHANNELS.map((c) => [c, 0]));
  for (const post of publishedChannels) {
    for (const c of post.channels) {
      if (channelCount.has(c)) channelCount.set(c, (channelCount.get(c) ?? 0) + 1);
    }
  }

  /** Багийн идэвх — нэрийг тусад нь, `NewsActivity` нь `User`-тэй холбоогүй */
  const perUser = new Map<string, number>();
  for (const row of teamActivity) {
    if (!row.userId) continue;
    perUser.set(row.userId, (perUser.get(row.userId) ?? 0) + 1);
  }
  const users = perUser.size
    ? await prisma.user.findMany({
        where: { id: { in: [...perUser.keys()] } },
        select: { id: true, name: true },
      })
    : [];
  const team = [...perUser.entries()]
    .map(([id, actions]) => ({
      name: users.find((u) => u.id === id)?.name ?? "Хэрэглэгч",
      actions,
    }))
    .sort((a, b) => b.actions - a.actions)
    .slice(0, 6);

  const issues = candidates
    .map((p) => {
      const missing: string[] = [];
      if (!p.lead?.trim()) missing.push("товч агуулга");
      if (!p.categoryId) missing.push("ангилал");
      if (p.sources.length === 0) missing.push("эх сурвалж");
      return { id: p.id, title: p.title, missing };
    })
    .filter((p) => p.missing.length > 0)
    .slice(0, 6);

  return {
    counts,
    week: { now: weekNow, before: weekBefore },
    comments: { total: commentsTotal, today: commentsToday },
    media: { total: mediaTotal, videos: mediaVideos },
    chart: bucketActivity(activity, chartDays, now),
    byCategory,
    agenda: agendaRows.map((a) => ({ time: a.time, text: a.text })),
    live: live
      ? {
          attendance: live.attendance,
          sessionStatus: live.sessionStatus,
          tickerOn: live.tickerOn,
          liveOn: live.liveOn,
          breakingOn: live.breakingOn,
        }
      : null,
    channels: [...channelCount.entries()].map(([name, count]) => ({ name, count })),
    team,
    issues,
  };
}
