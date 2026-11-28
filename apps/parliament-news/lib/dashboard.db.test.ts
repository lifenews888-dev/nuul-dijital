import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import { dashboardData } from "./dashboard";

/**
 * Самбарын өгөгдөл.
 *
 * Самбар нь РЕДАКЦЫН дотоод хуудас тул нийтийн хаалга энд үйлчлэхгүй —
 * ноорог, хянагдаж буй бүгд тоологдоно. `forTenant`-ийн хаалга харин
 * хэвээр: хөршийн тоо манай самбарт орох ёсгүй.
 */
const sfx = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
const MARK = `dash-${sfx}`;

let tenantId: string;
let foreignTenantId: string;
let userId: string;
let categoryId: string;

beforeAll(async () => {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug() } });
  if (!tenant) throw new Error(`Tenant "${tenantSlug()}" олдсонгүй — seed ажиллуулна уу`);
  tenantId = tenant.id;

  const foreign = await prisma.tenant.create({
    data: { slug: `dash-foreign-${sfx}`, name: `Гадны ${sfx}` },
    select: { id: true },
  });
  foreignTenantId = foreign.id;

  const cat = await prisma.newsCategory.findFirst({ where: { tenantId }, select: { id: true } });
  if (!cat) throw new Error("Ангилал олдсонгүй — seed ажиллуулна уу");
  categoryId = cat.id;

  const user = await prisma.user.create({
    data: { email: `${MARK}@test.local`, name: `Самбар ${sfx}` },
    select: { id: true },
  });
  userId = user.id;

  const make = (
    slug: string,
    status: "DRAFT" | "REVIEW" | "APPROVED" | "PUBLISHED" | "RETURNED",
    tId: string,
    extra: Record<string, unknown> = {},
  ) =>
    prisma.newsPost.create({
      data: {
        tenantId: tId,
        slug,
        title: `${MARK} ${slug}`,
        date: new Date("2026-11-20T00:00:00Z"),
        status,
        subcategory: MARK,
        ...extra,
      },
      select: { id: true },
    });

  await make(`${MARK}-d1`, "DRAFT", tenantId);
  await make(`${MARK}-d2`, "DRAFT", tenantId);
  await make(`${MARK}-r`, "REVIEW", tenantId);
  /** Бүрэн мэдээ — чанарын шалгалтад ГАРАХ ЁСГҮЙ */
  await make(`${MARK}-p`, "PUBLISHED", tenantId, {
    categoryId,
    publishedAt: new Date(Date.now() - 86_400_000),
    channels: ["Сайт", "Facebook"],
    lead: "Тойм",
    sources: ["https://parliament.mn/a"],
  });
  /** Дутуу — чанарын шалгалтад гарах ёстой */
  await make(`${MARK}-bad`, "APPROVED", tenantId);
  /** Хөршийнх — манай тоонд ОРОХ ЁСГҮЙ */
  await make(`${MARK}-foreign`, "DRAFT", foreignTenantId);

  await prisma.newsActivity.createMany({
    data: [
      { tenantId, postId: null, userId, action: "publish", note: MARK },
      { tenantId, postId: null, userId, action: "save", note: MARK },
      { tenantId: foreignTenantId, postId: null, userId, action: "publish", note: MARK },
    ],
  });
});

afterAll(async () => {
  await prisma.newsActivity.deleteMany({ where: { note: MARK } });
  await prisma.newsPost.deleteMany({ where: { subcategory: MARK } });
  await prisma.user.deleteMany({ where: { email: `${MARK}@test.local` } });
  await prisma.tenant.delete({ where: { id: foreignTenantId } });
});

describe("dashboardData", () => {
  it("төлөв бүрийн тоо — ноорог ч тоологдоно", async () => {
    const d = await dashboardData(tenantId, userId);
    expect(d.counts.DRAFT).toBeGreaterThanOrEqual(2);
    expect(d.counts.REVIEW).toBeGreaterThanOrEqual(1);
  });

  it("таван төлөв бүгд байна — хоосон нь тэг", async () => {
    const d = await dashboardData(tenantId, userId);
    for (const s of ["DRAFT", "REVIEW", "APPROVED", "PUBLISHED", "RETURNED"] as const) {
      expect(typeof d.counts[s]).toBe("number");
    }
  });

  /** forTenant-ийн хаалга самбарт ч хэвээр */
  it("хөршийн мэдээ тоонд ОРОХГҮЙ", async () => {
    const mine = await dashboardData(tenantId, userId);
    const theirs = await dashboardData(foreignTenantId, userId);
    expect(theirs.counts.DRAFT).toBe(1);
    expect(mine.counts.DRAFT).toBeGreaterThan(theirs.counts.DRAFT);
  });

  it("долоо хоногийн нийтлэлийг тоолно", async () => {
    const d = await dashboardData(tenantId, userId);
    expect(d.week.now).toBeGreaterThanOrEqual(1);
    expect(typeof d.week.before).toBe("number");
  });

  it("график нь хоногийн тоогоор, хоосон өдөр ч", async () => {
    expect((await dashboardData(tenantId, userId, 14)).chart).toHaveLength(14);
    expect((await dashboardData(tenantId, userId, 90)).chart).toHaveLength(90);
  });

  it("графикт нийтлэл тусад нь", async () => {
    const d = await dashboardData(tenantId, userId, 14);
    const total = d.chart.reduce((n, p) => n + p.published, 0);
    expect(total).toBeGreaterThanOrEqual(1);
  });

  it("хөршийн үйл явдал графикт орохгүй", async () => {
    const theirs = await dashboardData(foreignTenantId, userId, 14);
    expect(theirs.chart.reduce((n, p) => n + p.published + p.other, 0)).toBe(1);
  });

  it("ангиллаар — мэдээгүй ангилал гарахгүй", async () => {
    const d = await dashboardData(tenantId, userId);
    expect(d.byCategory.every((c) => c.count > 0)).toBe(true);
  });

  it("сувгаар нийтлэгдсэнийг тоолно", async () => {
    const d = await dashboardData(tenantId, userId);
    const site = d.channels.find((c) => c.name === "Сайт");
    expect(site?.count).toBeGreaterThanOrEqual(1);
    expect(d.channels.map((c) => c.name)).toEqual([
      "Сайт",
      "Facebook",
      "YouTube",
      "Instagram",
      "TikTok",
      "Telegram",
    ]);
  });

  it("автомат нийтлэлийн дараалал тоологдоно", async () => {
    const d = await dashboardData(tenantId, userId);
    for (const k of ["queued", "sent", "failed", "skipped"] as const) {
      expect(d.socialQueue[k]).toBeGreaterThanOrEqual(0);
    }
  });

  it("багийн идэвх — нэртэйгээ", async () => {
    const d = await dashboardData(tenantId, userId);
    const me = d.team.find((t) => t.name === `Самбар ${sfx}`);
    expect(me?.actions).toBeGreaterThanOrEqual(2);
  });

  /** Дутуу мэдээг нэрлэх нь самбарын гол ажил */
  it("чанарын шалгалт нь дутуу зүйлийг нэрлэнэ", async () => {
    const d = await dashboardData(tenantId, userId);
    const bad = d.issues.find((i) => i.title.endsWith(`${MARK}-bad`));
    expect(bad?.missing).toContain("товч агуулга");
    expect(bad?.missing).toContain("эх сурвалж");
  });

  it("бүрэн мэдээ чанарын шалгалтад ОРОХГҮЙ", async () => {
    const d = await dashboardData(tenantId, userId);
    expect(d.issues.some((i) => i.title.endsWith(`${MARK}-p`))).toBe(false);
  });

  it("сэтгэгдэл, медиагийн тоо", async () => {
    const d = await dashboardData(tenantId, userId);
    expect(typeof d.comments.total).toBe("number");
    expect(typeof d.media.videos).toBe("number");
  });

  it("мэдээгүй tenant-д ч унахгүй", async () => {
    const d = await dashboardData(foreignTenantId, userId);
    expect(d.issues).toEqual([]);
    expect(d.byCategory).toEqual([]);
  });
});
