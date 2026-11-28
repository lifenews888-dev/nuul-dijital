import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import { billById, allBills } from "./bill-page";

const sfx = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
let tenantId: string;
let openId = "";
let draftId = "";

beforeAll(async () => {
  const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug(), active: true } });
  if (!tenant) throw new Error("tenant алга — эхлээд seed");
  tenantId = tenant.id;

  const pub = await prisma.newsPost.create({
    data: {
      tenantId,
      slug: `bill-pub-${sfx}`,
      title: `Нийтлэгдсэн ${sfx}`,
      date: new Date(),
      status: "PUBLISHED",
      publishedAt: new Date(Date.now() - 86_400_000),
    },
  });
  const draft = await prisma.newsPost.create({
    data: { tenantId, slug: `bill-draft-${sfx}`, title: `НУУЦ НООРОГ ${sfx}`, date: new Date() },
  });

  const a = await prisma.bill.create({
    data: { tenantId, postId: pub.id, title: `Нээлттэй төсөл ${sfx}`, stage: 2, votesYes: 40, votesNo: 8 },
  });
  const b = await prisma.bill.create({
    data: { tenantId, postId: draft.id, title: `Ноорогтой төсөл ${sfx}`, stage: 1 },
  });
  openId = a.id;
  draftId = b.id;

  await prisma.billStage.createMany({
    data: [
      { tenantId, billId: a.id, index: 1, note: "Хоёр дахь шат" },
      { tenantId, billId: a.id, index: 0, note: "Эхний шат" },
    ],
  });
});

afterAll(async () => {
  await prisma.billStage.deleteMany({ where: { billId: { in: [openId, draftId] } } });
  await prisma.bill.deleteMany({ where: { id: { in: [openId, draftId] } } });
  await prisma.newsPost.deleteMany({ where: { slug: { contains: sfx } } });
  await prisma.$disconnect();
});

describe("billById", () => {
  it("төслийг шатуудтай нь, индексээр эрэмбэлж авна", async () => {
    const b = await billById(openId);
    expect(b?.stage).toBe(2);
    expect(b?.steps.map((s) => s.index)).toEqual([0, 1]);
  });

  it("нийтлэгдсэн мэдээг холбоно", async () => {
    expect((await billById(openId))?.post?.slug).toBe(`bill-pub-${sfx}`);
  });

  it("НООРОГ мэдээ гоожихгүй — гарчиг нь ч гарахгүй", async () => {
    const b = await billById(draftId);
    expect(b).not.toBeNull();
    expect(b?.post).toBeNull();
    expect(JSON.stringify(b)).not.toContain("НУУЦ НООРОГ");
  });

  it("байхгүй id нь null", async () => {
    expect(await billById("bxxxxxxxxxxxxxxxxxxxxxxx")).toBeNull();
  });

  it("allBills нь өөрийн төслүүдийг агуулна", async () => {
    const ids = (await allBills()).map((b) => b.id);
    expect(ids).toContain(openId);
    expect(ids).toContain(draftId);
  });
});
