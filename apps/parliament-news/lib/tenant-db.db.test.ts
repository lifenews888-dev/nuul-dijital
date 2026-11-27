import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@nuul/db-news";
import { forTenant, tenantData } from "./tenant-db";

let a: string, b: string;
/**
 * Файл тус бүрийн дагавар. `Date.now()` ДАНГААРАА хүрэхгүй: vitest нь
 * файлуудыг зэрэгцээ ажиллуулдаг тул хоёр файл нэг миллисекундэд эхэлж,
 * ИЖИЛ дагавар авч болно. Тэр үед нэг файлын `sfx`-ээр хийсэн хайлт
 * нөгөөгийн өгөгдлийг олж, тест үл баригдах болно (бодитоор тохиолдсон:
 * `posts.db.test.ts`-ийн «том/жижиг үсэг» тест 4 ажиллуулалтаас 2-т
 * улаан болов). Санамсаргүй сүүл нь түүнийг хаана.
 */
const sfx = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;

beforeAll(async () => {
  const ta = await prisma.tenant.create({ data: { slug: `test-a-${sfx}`, name: "A", domains: [] } });
  const tb = await prisma.tenant.create({ data: { slug: `test-b-${sfx}`, name: "B", domains: [] } });
  a = ta.id;
  b = tb.id;
  await prisma.newsPost.create({ data: { tenantId: a, slug: "a-post", title: "A мэдээ", date: new Date() } });
  await prisma.newsPost.create({ data: { tenantId: b, slug: "b-post", title: "B мэдээ", date: new Date() } });
});

afterAll(async () => {
  const ids = [a, b].filter(Boolean);
  if (ids.length) {
    await prisma.tenant.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.$disconnect();
});

describe("forTenant", () => {
  it("зөвхөн өөрийн tenant-ийн мэдээг уншина", async () => {
    const rows = await forTenant(a).newsPost.findMany({});
    expect(rows.map((r) => r.slug)).toEqual(["a-post"]);
    const leak = await forTenant(a).newsPost.findFirst({ where: { slug: "b-post" } });
    expect(leak).toBeNull();
  });

  it("create дээр tenantId-г автоматаар тавина", async () => {
    const created = await forTenant(a).newsPost.create({
      // `tenantData` нь гүйцэтгэлд юу ч хийхгүй — extension нь tenantId-г
      // өөрөө тавина. Prisma-ийн төрөл түүнийг мэдэхгүй тул цоорхойг нөхнө.
      data: tenantData({ slug: `auto-${sfx}`, title: "Авто", date: new Date() }),
    });
    expect(created.tenantId).toBe(a);
  });

  it("updateMany өөр tenant-д хүрэхгүй", async () => {
    const n = await forTenant(a).newsPost.updateMany({ where: {}, data: { kicker: "A" } });
    expect(n.count).toBeGreaterThan(0);
    const bRow = await prisma.newsPost.findFirst({ where: { tenantId: b } });
    expect(bRow?.kicker).toBeNull();
  });
});
