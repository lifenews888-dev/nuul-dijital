import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import { studioPost, studioCategories } from "./studio-post";

/**
 * Засварлагчийн УНШИЛТ.
 *
 * Нийтийн `postBySlug` нь `publishedWhere()`-ээр явдаг — редакторт
 * хэрэггүй. Засварлагч нь ноорог, буцаасан, цаг товлосон бүгдийг
 * нээх ёстой: тэд л ажил юм. `forTenant`-ийн хаалга хэвээр.
 */
const sfx = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
const S = {
  draft: `sp-draft-${sfx}`,
  media: `sp-media-${sfx}`,
  bill: `sp-bill-${sfx}`,
  foreign: `sp-foreign-${sfx}`,
};

let tenantId: string;
let foreignTenantId: string;
const ids: Record<string, string> = {};

beforeAll(async () => {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug() } });
  if (!tenant) throw new Error(`Tenant "${tenantSlug()}" олдсонгүй — seed ажиллуулна уу`);
  tenantId = tenant.id;

  const foreign = await prisma.tenant.create({
    data: { slug: `sp-foreign-${sfx}`, name: `Гадны ${sfx}` },
    select: { id: true },
  });
  foreignTenantId = foreign.id;

  const make = (slug: string, tId: string) =>
    prisma.newsPost.create({
      data: {
        tenantId: tId,
        slug,
        title: `Засварлагч ${slug}`,
        kicker: "Нуруу",
        lead: "Тойм",
        body: "Биет",
        date: new Date("2026-11-20T00:00:00Z"),
        status: "DRAFT",
        tags: ["шошго"],
        sources: ["https://parliament.mn/a"],
        channels: ["Сайт"],
        motif: "hemi",
        theme: 1,
        look: { bg: "#101010" },
      },
      select: { id: true },
    });

  ids.draft = (await make(S.draft, tenantId)).id;
  ids.media = (await make(S.media, tenantId)).id;
  ids.bill = (await make(S.bill, tenantId)).id;
  ids.foreign = (await make(S.foreign, foreignTenantId)).id;

  await prisma.newsMedia.createMany({
    data: [
      { tenantId, postId: ids.media, url: "https://b.mn/c.jpg", kind: "image", order: 2 },
      { tenantId, postId: ids.media, url: "https://b.mn/a.jpg", kind: "image", order: 0 },
      { tenantId, postId: ids.media, url: "https://b.mn/b.jpg", kind: "image", order: 1 },
    ],
  });

  const bill = await prisma.bill.create({
    data: { tenantId, postId: ids.bill, title: `Төсөл ${sfx}`, stage: 3, votesYes: 40, votesNo: 12 },
    select: { id: true },
  });
  await prisma.billStage.createMany({
    data: [0, 1, 2, 3, 4].map((index) => ({
      tenantId,
      billId: bill.id,
      index,
      note: `Шат ${index}`,
    })),
  });
});

afterAll(async () => {
  const postIds = Object.values(ids);
  /*
   * ЗӨВХӨН өөрийн төслийн шатууд. Өмнө нь энэ нь tenant доторх БҮХ шатыг
   * устгадаг байсан — vitest файлуудыг зэрэгцээ ажиллуулдаг тул
   * `article-view.db.test.ts`-ийн шатуудыг дундуур нь авч оддог,
   * гурван ажиллуулалтын гуравт нь улаан болов.
   */
  await prisma.billStage.deleteMany({ where: { bill: { postId: { in: postIds } } } });
  await prisma.bill.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.newsMedia.deleteMany({ where: { postId: { in: postIds } } });
  await prisma.newsPost.deleteMany({ where: { slug: { in: Object.values(S) } } });
  await prisma.tenant.delete({ where: { id: foreignTenantId } });
});

describe("studioPost", () => {
  it("ноорогийг ч уншина — нийтийн хаалга энд биш", async () => {
    const p = await studioPost(tenantId, ids.draft);
    expect(p).not.toBeNull();
    expect(p?.status).toBe("DRAFT");
  });

  it("формд хэрэгтэй бүх талбарыг", async () => {
    const p = await studioPost(tenantId, ids.draft);
    expect(p?.kicker).toBe("Нуруу");
    expect(p?.lead).toBe("Тойм");
    expect(p?.body).toBe("Биет");
    expect(p?.tags).toEqual(["шошго"]);
    expect(p?.sources).toEqual(["https://parliament.mn/a"]);
    expect(p?.channels).toEqual(["Сайт"]);
    expect(p?.motif).toBe("hemi");
    expect(p?.theme).toBe(1);
    expect(p?.look).toEqual({ bg: "#101010" });
  });

  it("медиаг дарааллаар нь", async () => {
    const p = await studioPost(tenantId, ids.media);
    expect(p?.media.map((m) => m.order)).toEqual([0, 1, 2]);
    expect(p?.media[0].url).toBe("https://b.mn/a.jpg");
  });

  it("хуулийн төслийн шатуудыг дарааллаар нь", async () => {
    const p = await studioPost(tenantId, ids.bill);
    expect(p?.bill?.stage).toBe(3);
    expect(p?.bill?.votesYes).toBe(40);
    expect(p?.bill?.steps).toHaveLength(5);
    expect(p?.bill?.steps.map((s) => s.index)).toEqual([0, 1, 2, 3, 4]);
    expect(p?.bill?.steps[2].note).toBe("Шат 2");
  });

  it("хуулийн төсөлгүй бол null", async () => {
    expect((await studioPost(tenantId, ids.draft))?.bill).toBeNull();
  });

  it("медиагүй бол хоосон массив, null биш", async () => {
    expect((await studioPost(tenantId, ids.draft))?.media).toEqual([]);
  });

  /** Tenant-ийн хаалга засварлагчид ч хэвээр */
  it("өөр tenant-ийн мэдээг өгөхгүй", async () => {
    expect(await studioPost(tenantId, ids.foreign)).toBeNull();
  });

  it("байхгүй id-д null, шидэхгүй", async () => {
    expect(await studioPost(tenantId, "no-such-post")).toBeNull();
  });

  it("зэрэгцээ засварлалт илрүүлэхэд updatedAt хэрэгтэй", async () => {
    expect((await studioPost(tenantId, ids.draft))?.updatedAt).toBeInstanceOf(Date);
  });
});

describe("studioCategories", () => {
  it("ангиллын нэрсийг дарааллаар нь", async () => {
    const names = await studioCategories(tenantId);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => typeof n === "string")).toBe(true);
  });

  it("өөр tenant-ийнхыг өгөхгүй", async () => {
    expect(await studioCategories(foreignTenantId)).toEqual([]);
  });
});
