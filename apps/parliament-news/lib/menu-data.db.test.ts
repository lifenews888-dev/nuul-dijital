import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import { menuData, MENU_MAX } from "./menu-data";

/**
 * Цэсний өгөгдөл — НИЙТИЙН хаалгаар.
 *
 * Цэс нь уншигчийн гадаргуу тул `publishedWhere()`-ийн дүрэм энд
 * ҮЙЛЧИЛНЭ: ноорог, цаг товлосон мэдээ ХАРАГДАХ ЁСГҮЙ. Студийн
 * жагсаалт (`studio-posts.ts`) нь эсрэгээрээ — хоёрыг хольвол
 * уншигчид ноорог гарна.
 */
const sfx = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
const S = {
  live: `menu-live-${sfx}`,
  draft: `menu-draft-${sfx}`,
  scheduled: `menu-scheduled-${sfx}`,
  video: `menu-video-${sfx}`,
  bill: `menu-bill-${sfx}`,
};

let tenantId: string;
let categoryId: string;

beforeAll(async () => {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug() } });
  if (!tenant) throw new Error(`Tenant "${tenantSlug()}" олдсонгүй — seed ажиллуулна уу`);
  tenantId = tenant.id;

  const cat = await prisma.newsCategory.findFirst({ where: { tenantId }, select: { id: true } });
  if (!cat) throw new Error("Ангилал олдсонгүй — seed ажиллуулна уу");
  categoryId = cat.id;

  const make = (
    slug: string,
    status: "PUBLISHED" | "DRAFT",
    publishedAt: Date | null,
    extra: Record<string, unknown> = {},
  ) =>
    prisma.newsPost.create({
      data: {
        tenantId,
        slug,
        title: `Цэс ${slug}`,
        lead: "Тойм",
        date: new Date("2026-11-20T00:00:00Z"),
        status,
        publishedAt,
        categoryId,
        tags: ["цэсний-шошго"],
        ...extra,
      },
    });

  const past = new Date(Date.now() - 86_400_000);
  const future = new Date(Date.now() + 2 * 86_400_000);

  await make(S.live, "PUBLISHED", past);
  await make(S.draft, "DRAFT", null);
  await make(S.scheduled, "PUBLISHED", future);
  const video = await make(S.video, "PUBLISHED", past);
  const bill = await make(S.bill, "PUBLISHED", past);

  await prisma.newsMedia.create({
    data: { tenantId, postId: video.id, url: "https://example.mn/v.mp4", kind: "video", order: 0 },
  });
  await prisma.bill.create({
    data: { tenantId, postId: bill.id, title: `Төсөл ${sfx}`, stage: 3 },
  });
});

afterAll(async () => {
  const ids = await prisma.newsPost.findMany({
    where: { slug: { in: Object.values(S) } },
    select: { id: true },
  });
  const postIds = ids.map((p) => p.id);
  await prisma.bill.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.newsMedia.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.newsPost.deleteMany({ where: { slug: { in: Object.values(S) } } });
});

const slugs = (rows: { slug: string }[]) => rows.map((r) => r.slug);

describe("menuData", () => {
  it("нийтлэгдсэн мэдээг өгнө", async () => {
    const { posts } = await menuData();
    expect(slugs(posts)).toContain(S.live);
  });

  /** Нийтийн хаалга — студийн жагсаалттай ЭСРЭГ дүрэм */
  it("ноорог мэдээг ӨГӨХГҮЙ", async () => {
    const { posts } = await menuData();
    expect(slugs(posts)).not.toContain(S.draft);
  });

  it("цаг товлосон мэдээг ӨГӨХГҮЙ", async () => {
    const { posts } = await menuData();
    expect(slugs(posts)).not.toContain(S.scheduled);
  });

  it("видеотойг нь тэмдэглэнэ", async () => {
    const { posts } = await menuData();
    expect(posts.find((p) => p.slug === S.video)?.hasVideo).toBe(true);
    expect(posts.find((p) => p.slug === S.live)?.hasVideo).toBe(false);
  });

  it("хуулийн төслийн шатыг өгнө", async () => {
    const { posts } = await menuData();
    expect(posts.find((p) => p.slug === S.bill)?.billStage).toBe(3);
    expect(posts.find((p) => p.slug === S.live)?.billStage).toBeNull();
  });

  it("шошгыг өгнө — хайлтад хэрэгтэй", async () => {
    const { posts } = await menuData();
    expect(posts.find((p) => p.slug === S.live)?.tags).toContain("цэсний-шошго");
  });

  it("ангиллын нэрийг өгнө", async () => {
    const { posts } = await menuData();
    expect(posts.find((p) => p.slug === S.live)?.category).toBeTypeOf("string");
  });

  it("шинэ нь дээр", async () => {
    const { posts } = await menuData();
    for (let i = 1; i < posts.length; i += 1) {
      expect(posts[i - 1].date.getTime()).toBeGreaterThanOrEqual(posts[i].date.getTime());
    }
  });

  it("хязгаартай", async () => {
    const { posts } = await menuData();
    expect(posts.length).toBeLessThanOrEqual(MENU_MAX);
  });

  it("ангиллын дарааллыг өгнө", async () => {
    const { order } = await menuData();
    expect(Array.isArray(order)).toBe(true);
    expect(order.every((c) => typeof c === "string")).toBe(true);
  });
});
