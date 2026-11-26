import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import {
  listPosts,
  countPosts,
  postBySlug,
  postIdByRedirect,
  postsByCategory,
  postsByTag,
  searchPosts,
  menuCategories,
  allPublishedForFeed,
} from "./posts";

/**
 * Эдгээр нь `requireTenant()`-ээр дамжих бодит замыг шалгана, тиймээс өөрийн
 * tenant үүсгэхгүй: `NEWS_TENANT_SLUG`-ийн заасан жинхэнэ tenant дотор
 * түр мэдээ үүсгээд, төгсгөлд устгана. Tenant-ыг УСТГАХГҮЙ — cascade нь
 * seed-ийн бүх өгөгдлийг авч одно.
 *
 * Батламжууд нь өөрийн дагавартай мэдээнүүдээр хязгаарлагдана: санд демо
 * контент байж болно, тэднээс хамаарах тест хэврэг болно.
 */
const sfx = Date.now().toString(36);
const S = {
  pub: `pub-${sfx}`,
  draft: `draft-${sfx}`,
  review: `review-${sfx}`,
  appr: `appr-${sfx}`,
  future: `future-${sfx}`,
};
const ALL = Object.values(S);
const TAG = `t-${sfx}`;
const OLD_SLUG = `huuchin-${sfx}`;
const OLD_SLUG_DRAFT = `huuchin-draft-${sfx}`;

let tenantId: string;
let categorySlug: string;

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
  categorySlug = category.slug;

  const yesterday = new Date(Date.now() - 86_400_000);
  const tomorrow = new Date(Date.now() + 86_400_000);
  const common = {
    tenantId,
    categoryId: category.id,
    tags: [TAG],
    date: new Date(),
    lead: `Товч агуулга ${sfx}`,
  };

  await prisma.newsPost.createMany({
    data: [
      {
        ...common,
        slug: S.pub,
        title: `Туршилтын мэдээ ${sfx}`,
        body: `Энэ бол биет ${sfx}`,
        status: "PUBLISHED",
        publishedAt: yesterday,
      },
      { ...common, slug: S.draft, title: `Ноорог ${sfx}`, status: "DRAFT" },
      { ...common, slug: S.review, title: `Хянагдаж буй ${sfx}`, status: "REVIEW" },
      { ...common, slug: S.appr, title: `Батлагдсан ${sfx}`, status: "APPROVED" },
      {
        ...common,
        slug: S.future,
        title: `Цаг товлосон ${sfx}`,
        status: "PUBLISHED",
        publishedAt: tomorrow,
      },
    ],
  });

  // Хуучин хаягууд: нэг нь нийтлэгдсэн мэдээ рүү, нэг нь ноорог руу
  const pub = await prisma.newsPost.findFirst({ where: { tenantId, slug: S.pub } });
  const draft = await prisma.newsPost.findFirst({ where: { tenantId, slug: S.draft } });
  await prisma.newsSlugRedirect.createMany({
    data: [
      { tenantId, fromSlug: OLD_SLUG, postId: pub!.id },
      { tenantId, fromSlug: OLD_SLUG_DRAFT, postId: draft!.id },
    ],
  });
});

afterAll(async () => {
  await prisma.newsSlugRedirect.deleteMany({
    where: { fromSlug: { in: [OLD_SLUG, OLD_SLUG_DRAFT] } },
  });
  await prisma.newsPost.deleteMany({ where: { slug: { in: ALL } } });
  await prisma.$disconnect();
});

describe("нийтийн уншилтын хаалга", () => {
  it("listPosts нь зөвхөн нийтлэгдсэн, цаг нь болсон мэдээг буцаана", async () => {
    const slugs = (await listPosts({ take: 200 })).map((p) => p.slug);
    expect(slugs).toContain(S.pub);
    for (const s of [S.draft, S.review, S.appr, S.future]) {
      expect(slugs).not.toContain(s);
    }
  });

  it("postBySlug нь ноорог, хянагдаж буй, батлагдсан мэдээнд null", async () => {
    for (const s of [S.draft, S.review, S.appr]) {
      expect(await postBySlug(s)).toBeNull();
    }
  });

  it("postBySlug нь цаг товлосон мэдээнд null (publishedAt ирээдүйд)", async () => {
    expect(await postBySlug(S.future)).toBeNull();
  });

  it("postBySlug нь нийтлэгдсэн мэдээг биеттэй буцаана", async () => {
    const p = await postBySlug(S.pub);
    expect(p?.slug).toBe(S.pub);
    expect(p?.body).toContain("биет");
    expect(p?.categoryName).toBeTruthy();
    expect(p?.publishedAt).toBeInstanceOf(Date);
  });

  it("байхгүй slug → null", async () => {
    expect(await postBySlug(`baihgui-${sfx}`)).toBeNull();
  });

  it("ангилал, таг, хайлт гурвуулаар нь ноорог гарч ирэхгүй", async () => {
    const byCat = await postsByCategory(categorySlug, { take: 200, skip: 0 });
    const byTag = await postsByTag(TAG, { take: 200, skip: 0 });
    const byQ = await searchPosts(sfx, { take: 200, skip: 0 });
    for (const rows of [byCat, byTag, byQ]) {
      const slugs = rows.map((r) => r.slug);
      expect(slugs).not.toContain(S.draft);
      expect(slugs).not.toContain(S.review);
      expect(slugs).not.toContain(S.appr);
      expect(slugs).not.toContain(S.future);
    }
  });

  it("тагаар хайхад зөвхөн тэр тагтай нийтлэгдсэн мэдээ", async () => {
    const rows = await postsByTag(TAG, { take: 200, skip: 0 });
    expect(rows.map((r) => r.slug)).toEqual([S.pub]);
  });

  it("кирилл таг ажиллана", async () => {
    const rows = await postsByTag("төсөв", { take: 5, skip: 0 });
    expect(Array.isArray(rows)).toBe(true);
  });

  it("хайлт нь том/жижиг үсгийг үл хэрэгсэнэ", async () => {
    const lower = await searchPosts(sfx, { take: 200, skip: 0 });
    const upper = await searchPosts(sfx.toUpperCase(), { take: 200, skip: 0 });
    expect(lower.map((r) => r.slug)).toEqual([S.pub]);
    expect(upper.map((r) => r.slug)).toEqual([S.pub]);
  });

  it("LIKE-ийн орлуулагч бүх мэдээг буцаахгүй", async () => {
    // Хянагч амьд системээс олсон: ?q=%% нь 12 мэдээ буцааж байв
    for (const q of ["%", "_", "%%%", "%_%"]) {
      expect(await searchPosts(q, { take: 200, skip: 0 })).toEqual([]);
    }
  });

  it("хоосон хайлт нь БҮХ мэдээг буцаахгүй, хоосон массив", async () => {
    for (const q of ["", "   ", "а".repeat(201)]) {
      expect(await searchPosts(q, { take: 200, skip: 0 })).toEqual([]);
    }
  });

  it("allPublishedForFeed мөн цаг товлосон мэдээг гаргахгүй", async () => {
    const slugs = (await allPublishedForFeed(500)).map((p) => p.slug);
    expect(slugs).toContain(S.pub);
    expect(slugs).not.toContain(S.future);
    expect(slugs).not.toContain(S.draft);
  });

  it("countPosts нь тагийн тоог зөв өгнө", async () => {
    expect(await countPosts({ tag: TAG })).toBe(1);
  });

  it("menuCategories нь цэсэнд тавьсан ангиллуудыг эрэмбээр өгнө", async () => {
    const cats = await menuCategories();
    expect(cats.length).toBeGreaterThan(0);
    for (const c of cats) {
      expect(typeof c.slug).toBe("string");
      expect(typeof c.name).toBe("string");
    }
  });

  it("postIdByRedirect нь хуучин хаягийг одоогийн slug руу хөрвүүлнэ", async () => {
    const hit = await postIdByRedirect(OLD_SLUG);
    expect(hit?.slug).toBe(S.pub);
  });

  it("нийтлээгүй мэдээ рүү чиглэсэн хуучин хаяг нь null — ноорог хаягаар ч гоожихгүй", async () => {
    expect(await postIdByRedirect(OLD_SLUG_DRAFT)).toBeNull();
  });

  it("байхгүй хуучин хаяг → null", async () => {
    expect(await postIdByRedirect(`baihgui-${sfx}`)).toBeNull();
  });

  it("хуудаслалт: skip/take хүндэтгэгдэнэ", async () => {
    const first = await listPosts({ take: 1, skip: 0 });
    const second = await listPosts({ take: 1, skip: 1 });
    expect(first.length).toBe(1);
    if (second.length) expect(second[0].slug).not.toBe(first[0].slug);
  });
});
