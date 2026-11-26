import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import { homeData } from "./home-data";

/**
 * `posts.db.test.ts`-ийн загвараар: жинхэнэ tenant дотор түр өгөгдөл үүсгээд
 * төгсгөлд устгана, tenant-ыг УСТГАХГҮЙ. Батламжууд нь өөрийн дагавартай
 * мөрүүдээр хязгаарлагдана — санд демо өгөгдөл байж болно.
 *
 * `LiveState` нь tenant-д ГАНЦ мөр (`tenantId @unique`) тул түүнийг хувилж
 * чадахгүй: эхэнд байсныг нь хадгалаад, төгсгөлд яг хэвээр нь сэргээнэ.
 */
const sfx = Date.now().toString(36);
const A = {
  one: `10:00 хуваарь ${sfx}`,
  two: `14:00 хуваарь ${sfx}`,
  three: `16:30 хуваарь ${sfx}`,
  tomorrow: `Маргаашийн хуваарь ${sfx}`,
};
const T = {
  on1: `Идэвхтэй нэг ${sfx}`,
  on2: `Идэвхтэй хоёр ${sfx}`,
  off: `ИДЭВХГҮЙ ${sfx}`,
};
const S = {
  live: `story-live-${sfx}`,
  expired: `story-expired-${sfx}`,
  draft: `story-draft-${sfx}`,
};

let tenantId: string;
let savedLive: Record<string, unknown> | null = null;

const utcDay = (offsetDays: number) => {
  const d = new Date();
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offsetDays),
  );
};

beforeAll(async () => {
  const slug = tenantSlug();
  const tenant = await prisma.tenant.findFirst({ where: { slug, active: true } });
  if (!tenant) {
    throw new Error(
      `"${slug}" tenant алга. Эхлээд: cd packages/db-news && ADMIN_EMAIL=... pnpm db:seed`,
    );
  }
  tenantId = tenant.id;

  const category = await prisma.newsCategory.findFirst({
    where: { tenantId },
    orderBy: { order: "asc" },
  });
  if (!category) throw new Error("Ангилал алга. Эхлээд seed-ийг ажиллуул.");

  const existing = await prisma.liveState.findUnique({ where: { tenantId } });
  savedLive = existing ? ({ ...existing } as Record<string, unknown>) : null;
  await prisma.liveState.upsert({
    where: { tenantId },
    update: { attendance: 98, sessionStatus: "Хуралдаж байна", tickerOn: true },
    create: { tenantId, attendance: 98, sessionStatus: "Хуралдаж байна", tickerOn: true },
  });

  await prisma.agenda.createMany({
    data: [
      // Зориуд эмх замбараагүй `order`-оор: эрэмбэлэлт ажиллаж байгааг харуулна
      { tenantId, date: utcDay(0), time: "16:30", text: A.three, order: 3 },
      { tenantId, date: utcDay(0), time: "10:00", text: A.one, order: 1 },
      { tenantId, date: utcDay(0), time: "14:00", text: A.two, order: 2 },
      { tenantId, date: utcDay(1), time: "09:00", text: A.tomorrow, order: 1 },
    ],
  });

  await prisma.tickerAd.createMany({
    data: [
      { tenantId, text: T.on2, active: true, order: 2 },
      { tenantId, text: T.on1, active: true, order: 1, url: "https://example.mn/a" },
      { tenantId, text: T.off, active: false, order: 0 },
    ],
  });

  const common = { tenantId, categoryId: category.id, date: new Date(), story: true };
  await prisma.newsPost.createMany({
    data: [
      {
        ...common,
        slug: S.live,
        title: `Амьд стори ${sfx}`,
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - 60_000),
        storyUntil: new Date(Date.now() + 86_400_000),
      },
      {
        ...common,
        slug: S.expired,
        title: `Хугацаа дууссан стори ${sfx}`,
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - 86_400_000),
        storyUntil: new Date(Date.now() - 60_000),
      },
      {
        ...common,
        slug: S.draft,
        title: `Ноорог стори ${sfx}`,
        status: "DRAFT",
        storyUntil: new Date(Date.now() + 86_400_000),
      },
    ],
  });
});

afterAll(async () => {
  await prisma.newsPost.deleteMany({ where: { slug: { in: Object.values(S) } } });
  await prisma.tickerAd.deleteMany({ where: { text: { in: Object.values(T) } } });
  await prisma.agenda.deleteMany({ where: { text: { in: Object.values(A) } } });
  await prisma.liveState.deleteMany({ where: { tenantId } });
  if (savedLive) {
    await prisma.liveState.create({ data: savedLive as never });
  }
  await prisma.$disconnect();
});

describe("homeData", () => {
  it("өнөөдрийн хуваарь л орно, маргаашийнх орохгүй", async () => {
    const { agenda } = await homeData();
    const mine = agenda.filter((a) => a.text.endsWith(sfx));
    expect(mine.map((a) => a.time)).toEqual(["10:00", "14:00", "16:30"]);
    expect(agenda.map((a) => a.text)).not.toContain(A.tomorrow);
  });

  it("идэвхгүй ticker орохгүй", async () => {
    const { ticker } = await homeData();
    expect(ticker.map((t) => t.text)).not.toContain(T.off);
    const mine = ticker.filter((t) => t.text.endsWith(sfx));
    expect(mine.map((t) => t.text)).toEqual([T.on1, T.on2]);
    expect(mine[0].url).toBe("https://example.mn/a");
    expect(mine[1].url).toBeNull();
  });

  it("хугацаа нь дууссан стори орохгүй", async () => {
    const { stories } = await homeData();
    expect(stories.map((s) => s.slug)).toContain(S.live);
    expect(stories.map((s) => s.slug)).not.toContain(S.expired);
  });

  it("ноорог стори ч орохгүй", async () => {
    const { stories } = await homeData();
    expect(stories.map((s) => s.slug)).not.toContain(S.draft);
  });

  it("live мөрийг уншина", async () => {
    const { live } = await homeData();
    expect(live?.attendance).toBe(98);
    expect(live?.sessionStatus).toBe("Хуралдаж байна");
    expect(live?.tickerOn).toBe(true);
  });

  it("latest ба featured нь нийтийн хаалгаар явна", async () => {
    const { latest, featured } = await homeData();
    expect(latest.map((p) => p.slug)).not.toContain(S.draft);
    expect(featured.every((p) => p.featured)).toBe(true);
  });

  /** Review Focus #3: виджетийн өгөгдөл огт байхгүй үед нүүр унахгүй */
  it("live мөр байхгүй бол null, унахгүй", async () => {
    await prisma.liveState.deleteMany({ where: { tenantId } });
    const { live, latest } = await homeData();
    expect(live).toBeNull();
    expect(Array.isArray(latest)).toBe(true);
    await prisma.liveState.create({
      data: { tenantId, attendance: 98, sessionStatus: "Хуралдаж байна", tickerOn: true },
    });
  });
});
