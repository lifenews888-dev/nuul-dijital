import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@nuul/db-news";
import type { NewsStatus } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import { studioPosts, studioCounts, STUDIO_LIST_MAX } from "./studio-posts";
import type { Actor } from "./permissions";

/**
 * Редакцын жагсаалт нь НИЙТИЙН хаалгаар явахгүй.
 *
 * `lib/posts.ts`-ийн `publishedWhere()` нь ноорог, хянагдаж буй, цаг
 * товлосон мэдээг зориуд хасдаг — уншигчид тэднийг харах ёсгүй. Редакц нь
 * ЯГ ТЭДГЭЭРИЙГ харах ёстой: тэд л ажил юм. Иймд энэ query тусдаа, гэхдээ
 * `forTenant`-ийн хаалга нь хэвээр.
 *
 * `home-data.db.test.ts`-ийн загвараар: жинхэнэ tenant дотор түр өгөгдөл
 * үүсгээд төгсгөлд устгана, tenant-ыг УСТГАХГҮЙ.
 */
const sfx = Date.now().toString(36);
const S = {
  draft: `studio-draft-${sfx}`,
  review: `studio-review-${sfx}`,
  approved: `studio-approved-${sfx}`,
  published: `studio-published-${sfx}`,
  returned: `studio-returned-${sfx}`,
  /** Бусдын ноорог — «зөвхөн минийх»-д гарах ЁСГҮЙ */
  other: `studio-other-${sfx}`,
  /** Гарчигт `%` — SQL-ийн орлуулагч зугтаахыг шалгана */
  percent: `studio-percent-${sfx}`,
};

const TITLE = {
  draft: `Ноорог мэдээ ${sfx}`,
  review: `Хянагдаж буй мэдээ ${sfx}`,
  percent: `Хувь 50% өссөн ${sfx}`,
};

let tenantId: string;
let chief: Actor;
let reporter: Actor;
let otherUserId: string;

const EMAIL = {
  chief: `studio-list-chief-${sfx}@test.local`,
  reporter: `studio-list-reporter-${sfx}@test.local`,
  other: `studio-list-other-${sfx}@test.local`,
};

beforeAll(async () => {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug() } });
  if (!tenant) throw new Error(`Tenant "${tenantSlug()}" олдсонгүй — seed ажиллуулна уу`);
  tenantId = tenant.id;

  const [c, r, o] = await Promise.all([
    prisma.user.create({ data: { email: EMAIL.chief, name: `Ахлах ${sfx}` } }),
    prisma.user.create({ data: { email: EMAIL.reporter, name: `Сэтгүүлч ${sfx}` } }),
    prisma.user.create({ data: { email: EMAIL.other, name: `Бусад ${sfx}` } }),
  ]);
  chief = { userId: c.id, role: "CHIEF" };
  reporter = { userId: r.id, role: "REPORTER" };
  otherUserId = o.id;

  const make = (slug: string, title: string, status: NewsStatus, authorId: string) =>
    prisma.newsPost.create({
      data: {
        tenantId,
        slug,
        title,
        date: new Date("2026-11-20T00:00:00Z"),
        status,
        authorId,
        publishedAt: status === "PUBLISHED" ? new Date("2026-11-20T06:00:00Z") : null,
      },
    });

  await make(S.draft, TITLE.draft, "DRAFT", reporter.userId);
  await make(S.review, TITLE.review, "REVIEW", reporter.userId);
  await make(S.approved, `Батлагдсан ${sfx}`, "APPROVED", reporter.userId);
  await make(S.published, `Нийтлэгдсэн ${sfx}`, "PUBLISHED", reporter.userId);
  await make(S.returned, `Буцаасан ${sfx}`, "RETURNED", reporter.userId);
  await make(S.other, `Бусдын ноорог ${sfx}`, "DRAFT", otherUserId);
  await make(S.percent, TITLE.percent, "DRAFT", reporter.userId);
});

afterAll(async () => {
  await prisma.newsPost.deleteMany({ where: { slug: { in: Object.values(S) } } });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAIL) } } });
});

const slugsOf = (rows: { slug: string }[]) => rows.map((r) => r.slug);
const ours = (rows: { slug: string }[]) =>
  slugsOf(rows).filter((s) => Object.values(S).includes(s));

describe("studioPosts", () => {
  it("ноорог, хянагдаж буй мэдээг ХАРУУЛНА — нийтийн хаалга энд биш", async () => {
    const slugs = slugsOf(await studioPosts(tenantId, chief, {}));
    expect(slugs).toContain(S.draft);
    expect(slugs).toContain(S.review);
    expect(slugs).toContain(S.returned);
    expect(slugs).toContain(S.published);
  });

  it("төлөвөөр шүүнэ", async () => {
    const rows = await studioPosts(tenantId, chief, { status: "REVIEW" });
    expect(rows.every((r) => r.status === "REVIEW")).toBe(true);
    expect(slugsOf(rows)).toContain(S.review);
  });

  it("«бүгд» нь шүүлтгүйтэй адил", async () => {
    const all = await studioPosts(tenantId, chief, { status: "all" });
    expect(slugsOf(all)).toContain(S.draft);
    expect(slugsOf(all)).toContain(S.published);
  });

  it("«зөвхөн минийх» нь бусдын мэдээг хасна", async () => {
    const rows = await studioPosts(tenantId, reporter, { mine: true });
    expect(rows.every((r) => r.authorId === reporter.userId)).toBe(true);
    expect(ours(rows)).not.toContain(S.other);
    expect(ours(rows)).toContain(S.draft);
  });

  it("гарчгаар хайна", async () => {
    const rows = await studioPosts(tenantId, chief, { q: TITLE.review });
    expect(slugsOf(rows)).toEqual([S.review]);
  });

  /**
   * `%` нь SQL-ийн «юу ч байж болно» орлуулагч. Зугтаагаагүй бол `%`
   * гэсэн хайлт БҮХ мэдээг буцаана — редактор хайлт эвдэрснийг мэдэхгүй,
   * зүгээр л «хайлт ажиллахгүй байна» гэж бодно.
   */
  it("хайлтын орлуулагч зугтаана", async () => {
    const rows = await studioPosts(tenantId, chief, { q: "%" });
    /** Зөвхөн ЖИНХЭНЭ `%`-тай гарчиг — зугтаагаагүй бол долоо нь бүгд гарна */
    expect(ours(rows)).toEqual([S.percent]);
  });

  it("далдлагдсан доогуур зураас ч зугтаана", async () => {
    const rows = await studioPosts(tenantId, chief, { q: "_" });
    /** `_` нь «ямар ч нэг тэмдэгт» — зугтаагаагүй бол бүх гарчиг таарна */
    expect(ours(rows)).toHaveLength(0);
  });

  it("гарчигт байгаа жинхэнэ хувийн тэмдгийг олно", async () => {
    const rows = await studioPosts(tenantId, chief, { q: "50%" });
    expect(slugsOf(rows)).toContain(S.percent);
  });

  it("хайлт нь том жижиг үсгийг үл ялгана", async () => {
    const rows = await studioPosts(tenantId, chief, { q: TITLE.review.toUpperCase() });
    expect(slugsOf(rows)).toContain(S.review);
  });

  it("шинэчилсэн дарааллаар — шинэ нь дээр", async () => {
    const rows = await studioPosts(tenantId, chief, {});
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1].updatedAt.getTime()).toBeGreaterThanOrEqual(rows[i].updatedAt.getTime());
    }
  });

  it("зохиогчийн нэр, ангиллыг хамт өгнө", async () => {
    const rows = await studioPosts(tenantId, chief, { q: TITLE.draft });
    expect(rows[0].authorName).toBe(`Сэтгүүлч ${sfx}`);
    expect(rows[0]).toHaveProperty("categoryName");
  });

  it("хязгаартай — бүх мэдээг нэг хуудсанд асгахгүй", async () => {
    const rows = await studioPosts(tenantId, chief, {});
    expect(rows.length).toBeLessThanOrEqual(STUDIO_LIST_MAX);
  });

  /** Tenant-ийн хаалга РЕДАКЦАД Ч хэвээр */
  it("өөр tenant-ийн мэдээ харагдахгүй", async () => {
    const rows = await studioPosts("tenant-that-does-not-exist", chief, {});
    expect(rows).toEqual([]);
  });
});

describe("studioCounts", () => {
  it("төлөв бүрийн тоо", async () => {
    const counts = await studioCounts(tenantId, chief);
    expect(counts.DRAFT).toBeGreaterThan(0);
    expect(counts.REVIEW).toBeGreaterThan(0);
    expect(counts.RETURNED).toBeGreaterThan(0);
  });

  it("таван төлөв бүгд байна — ноль ч тоо хэвээр", async () => {
    const counts = await studioCounts("tenant-that-does-not-exist", chief);
    expect(counts).toEqual({
      DRAFT: 0,
      REVIEW: 0,
      APPROVED: 0,
      PUBLISHED: 0,
      RETURNED: 0,
    });
  });
});
