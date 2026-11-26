/**
 * Нүүр хуудсыг НЭГ уншилтаар.
 *
 * Виджет бүр өөрийн функц дуудвал нүүр 6-7 удаа санд очно: тус бүр
 * `requireTenant()` → tenant-ийн уншилт, дараа нь өөрийн query. Энд
 * tenant-ийн хаалга НЭГ удаа нээгдээд, бүх уншилт нэг `Promise.all`-д
 * зэрэг явна.
 *
 * Нийтлээгүй мэдээг хаах нөхцөл нь энд ДАВТАГДААГҮЙ: `publishedWhere()`
 * нь `posts.ts`-д хэвээр, include/эрэмбэ нь `PUBLIC_LIST`-ээр ирнэ.
 */
import { requireTenant } from "./tenant";
import { forTenant } from "./tenant-db";
import { ubToday } from "./format";
import {
  publishedWhere,
  toListItem,
  PUBLIC_LIST,
  type PostListItem,
  type PostRow,
} from "./posts";

/** Нүүрэнд хэдэн мэдээ: тавиурын ном, онцлох багана, стори зурвас */
const LATEST_TAKE = 12;
const FEATURED_TAKE = 3;
const STORY_TAKE = 12;

export type LiveInfo = {
  attendance: number;
  sessionStatus: string;
  tickerOn: boolean;
  liveOn: boolean;
  liveTitle: string | null;
  liveUrl: string | null;
  breakingOn: boolean;
  breakingText: string | null;
  /** `breakingPostId`-ийн slug — зөвхөн мэдээ нь НИЙТЛЭГДСЭН бол */
  breakingSlug: string | null;
};

export type HomeData = {
  latest: PostListItem[];
  featured: PostListItem[];
  stories: PostListItem[];
  live: LiveInfo | null;
  agenda: { time: string; text: string }[];
  ticker: { text: string; url: string | null }[];
};

export async function homeData(): Promise<HomeData> {
  const tenant = await requireTenant();
  const db = forTenant(tenant.id);
  const now = new Date();
  const gate = publishedWhere(now);

  const [latest, featured, stories, live, agenda, ticker] = await Promise.all([
    db.newsPost.findMany({ where: gate, ...PUBLIC_LIST, take: LATEST_TAKE }),
    db.newsPost.findMany({
      where: { ...gate, featured: true },
      ...PUBLIC_LIST,
      take: FEATURED_TAKE,
    }),
    // Стори нь нийтийн хаалгаар БА хугацаа нь дуусаагүй байх ёстой
    db.newsPost.findMany({
      where: { ...gate, story: true, storyUntil: { gt: now } },
      ...PUBLIC_LIST,
      take: STORY_TAKE,
    }),
    // `findFirst` нь tenant-ийн хамрах хүрээг өргөтгөлөөс авна (`findUnique` биш)
    db.liveState.findFirst({}),
    db.agenda.findMany({
      where: { date: ubToday(now) },
      orderBy: { order: "asc" },
      select: { time: true, text: true },
    }),
    db.tickerAd.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { text: true, url: true },
    }),
  ]);

  /**
   * Яаралтай зурвасын холбоос нь нийтийн хаалгаар дамжина: ноорог мэдээ рүү
   * чиглүүлбэл толгой дээрх зурвас нь нийтлээгүй мэдээг зарлана. Мэдээ нь
   * тохирохгүй бол slug нь null — зурвасын текст нь холбоосгүй үлдэнэ.
   */
  let breakingSlug: string | null = null;
  if (live?.breakingOn && live.breakingPostId) {
    const post = await db.newsPost.findFirst({
      where: { id: live.breakingPostId, ...gate },
      select: { slug: true },
    });
    breakingSlug = post?.slug ?? null;
  }

  return {
    latest: (latest as PostRow[]).map(toListItem),
    featured: (featured as PostRow[]).map(toListItem),
    stories: (stories as PostRow[]).map(toListItem),
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
          breakingSlug,
        }
      : null,
    agenda,
    ticker,
  };
}
