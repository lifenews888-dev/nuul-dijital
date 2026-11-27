import { prisma } from "@nuul/db-news";
import type { NewsRole } from "@nuul/db-news";
import { forTenant } from "./tenant-db";
import { ubToday } from "./format";
import { getSetting } from "./settings";

/**
 * Редакцын УДИРДЛАГЫН уншилтууд — сэтгэгдэл, медиа сан, баг, тохиргоо.
 *
 * Дөрвөн хуудас, нэг файл: тэд бүгд ижил хэв маягтай (tenant-ийн хаалга,
 * жагсаалт, цөөн тоо) ба тус бүрдээ файл үүсгэх нь дөрвөн ижил импортын
 * толгой л нэмнэ.
 */

/* ───────────────────────── Сэтгэгдэл ───────────────────────── */

export const COMMENT_PAGE = 50;

export type StudioComment = {
  id: string;
  postId: string;
  postTitle: string;
  authorName: string;
  body: string;
  hidden: boolean;
  createdAt: Date;
};

export async function studioComments(
  tenantId: string,
  filter: { hidden?: boolean; q?: string } = {},
): Promise<StudioComment[]> {
  const rows = await forTenant(tenantId).newsComment.findMany({
    where: {
      ...(filter.hidden === undefined ? {} : { hidden: filter.hidden }),
      ...(filter.q?.trim()
        ? { body: { contains: filter.q.trim(), mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: COMMENT_PAGE,
    select: {
      id: true,
      postId: true,
      authorName: true,
      body: true,
      hidden: true,
      createdAt: true,
      post: { select: { title: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    postId: r.postId,
    postTitle: r.post?.title ?? "(устсан мэдээ)",
    authorName: r.authorName,
    body: r.body,
    hidden: r.hidden,
    createdAt: r.createdAt,
  }));
}

export async function commentCounts(
  tenantId: string,
): Promise<{ all: number; shown: number; hidden: number }> {
  const db = forTenant(tenantId);
  const [all, hidden] = await Promise.all([
    db.newsComment.count(),
    db.newsComment.count({ where: { hidden: true } }),
  ]);
  return { all, shown: all - hidden, hidden };
}

/* ───────────────────────── Медиа сан ───────────────────────── */

export const MEDIA_PAGE = 60;

export type StudioMediaItem = {
  id: string;
  url: string;
  kind: string;
  caption: string | null;
  postId: string;
  postTitle: string;
};

export async function studioMedia(
  tenantId: string,
  filter: { kind?: "image" | "video"; q?: string } = {},
): Promise<StudioMediaItem[]> {
  const rows = await forTenant(tenantId).newsMedia.findMany({
    where: {
      ...(filter.kind === "video"
        ? { kind: "video" }
        : filter.kind === "image"
          ? { kind: { not: "video" } }
          : {}),
      ...(filter.q?.trim()
        ? { post: { title: { contains: filter.q.trim(), mode: "insensitive" as const } } }
        : {}),
    },
    orderBy: { id: "desc" },
    take: MEDIA_PAGE,
    select: {
      id: true,
      url: true,
      kind: true,
      caption: true,
      postId: true,
      post: { select: { title: true } },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    url: r.url,
    kind: r.kind,
    caption: r.caption,
    postId: r.postId,
    postTitle: r.post?.title ?? "(устсан мэдээ)",
  }));
}

/* ───────────────────────── Баг ба эрх ───────────────────────── */

export type TeamMember = {
  userId: string;
  name: string | null;
  email: string;
  role: NewsRole;
  active: boolean;
  /** Сүүлийн 30 хоногийн үйлдлийн тоо */
  actions: number;
};

export async function studioTeam(tenantId: string): Promise<TeamMember[]> {
  const db = forTenant(tenantId);
  const members = await db.tenantMember.findMany({
    orderBy: { createdAt: "asc" },
    select: { userId: true, role: true, active: true },
  });
  if (members.length === 0) return [];

  const ids = members.map((m) => m.userId);
  const since = new Date(Date.now() - 30 * 86_400_000);

  const [users, activity] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, email: true },
    }),
    db.newsActivity.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  return members.map((m) => {
    const u = users.find((x) => x.id === m.userId);
    return {
      userId: m.userId,
      name: u?.name ?? null,
      email: u?.email ?? "(устсан)",
      role: m.role,
      active: m.active,
      actions: activity.find((a) => a.userId === m.userId)?._count._all ?? 0,
    };
  });
}

/* ───────────────────────── Тохиргоо ───────────────────────── */

export type SettingsData = {
  live: {
    attendance: number;
    sessionStatus: string;
    tickerOn: boolean;
    liveOn: boolean;
    liveTitle: string | null;
    liveUrl: string | null;
    breakingOn: boolean;
    breakingText: string | null;
    breakingPostId: string | null;
  };
  agenda: { time: string; text: string }[];
  ticker: { id: string; text: string; url: string | null; active: boolean }[];
  fx: { id: string; code: string; value: number; change: number }[];
  rates: { id: string; place: string; size: string | null; unit: string; price: number }[];
  banners: { id: string; imageUrl: string; linkUrl: string | null; placement: string }[];
  categories: { id: string; slug: string; name: string; inMenu: boolean; order: number }[];
  weather: unknown;
  header: unknown;
  footer: unknown;
  feed: unknown;
  /** Яаралтай мэдээний сонголтод — сүүлийн нийтлэгдсэн */
  recent: { id: string; title: string }[];
};

/** `LiveState` мөр байхгүй үед ч самбар бүтэн харагдах ёстой */
const EMPTY_LIVE = {
  attendance: 0,
  sessionStatus: "Хуралдаж байна",
  tickerOn: true,
  liveOn: false,
  liveTitle: null,
  liveUrl: null,
  breakingOn: false,
  breakingText: null,
  breakingPostId: null,
};

export async function settingsData(tenantId: string): Promise<SettingsData> {
  const db = forTenant(tenantId);
  const today = ubToday();

  const [live, agenda, ticker, fx, rates, banners, categories, weather, header, footer, feed, recent] =
    await Promise.all([
      db.liveState.findFirst({}),
      db.agenda.findMany({ where: { date: today }, orderBy: { order: "asc" } }),
      db.tickerAd.findMany({ orderBy: { order: "asc" } }),
      db.fxRate.findMany({ orderBy: { order: "asc" } }),
      db.adRate.findMany({ orderBy: { order: "asc" } }),
      db.banner.findMany({ orderBy: { order: "asc" } }),
      db.newsCategory.findMany({ orderBy: { order: "asc" } }),
      getSetting(db, "weather"),
      getSetting(db, "header"),
      getSetting(db, "footer"),
      getSetting(db, "feed"),
      db.newsPost.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 20,
        select: { id: true, title: true },
      }),
    ]);

  return {
    live: live
      ? {
          attendance: live.attendance,
          sessionStatus: live.sessionStatus,
          tickerOn: live.tickerOn,
          liveOn: live.liveOn,
          liveTitle: live.liveTitle,
          liveUrl: live.liveUrl,
          breakingOn: live.breakingOn,
          breakingText: live.breakingText,
          breakingPostId: live.breakingPostId,
        }
      : EMPTY_LIVE,
    agenda: agenda.map((a) => ({ time: a.time, text: a.text })),
    ticker: ticker.map((t) => ({ id: t.id, text: t.text, url: t.url, active: t.active })),
    fx: fx.map((r) => ({
      id: r.id,
      code: r.code,
      value: Number(r.value),
      change: Number(r.change),
    })),
    rates: rates.map((r) => ({
      id: r.id,
      place: r.place,
      size: r.size,
      unit: r.unit,
      price: r.price,
    })),
    banners: banners.map((b) => ({
      id: b.id,
      imageUrl: b.imageUrl,
      linkUrl: b.linkUrl,
      placement: b.placement,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      inMenu: c.inMenu,
      order: c.order,
    })),
    weather,
    header,
    footer,
    feed,
    recent,
  };
}
