import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import { postBySlug } from "./posts";
import { articleView } from "./article-view";

/** `posts.db.test.ts`-ийн журам: жинхэнэ tenant дотор түр мэдээ, төгсгөлд устгана. */
const sfx = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
const S = {
  main: `av-main-${sfx}`,
  newer: `av-newer-${sfx}`,
  older: `av-older-${sfx}`,
  oldest: `av-oldest-${sfx}`,
  draft: `av-draft-${sfx}`,
};
const ALL = Object.values(S);
let tenantId: string;

beforeAll(async () => {
  const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug(), active: true } });
  if (!tenant) throw new Error("tenant алга — эхлээд seed");
  tenantId = tenant.id;

  const category = await prisma.newsCategory.findFirst({
    where: { tenantId },
    orderBy: { order: "asc" },
  });
  if (!category) throw new Error("Ангилал алга");

  const day = 86_400_000;
  const now = Date.now();
  const common = { tenantId, categoryId: category.id, date: new Date(), lead: "Товч" };

  await prisma.newsPost.createMany({
    data: [
      { ...common, slug: S.newer, title: `Шинэ ${sfx}`, status: "PUBLISHED", publishedAt: new Date(now - day) },
      { ...common, slug: S.main, title: `Гол ${sfx}`, status: "PUBLISHED", publishedAt: new Date(now - 2 * day) },
      { ...common, slug: S.older, title: `Хуучин ${sfx}`, status: "PUBLISHED", publishedAt: new Date(now - 3 * day) },
      { ...common, slug: S.oldest, title: `Хамгийн хуучин ${sfx}`, status: "PUBLISHED", publishedAt: new Date(now - 4 * day) },
      { ...common, slug: S.draft, title: `Ноорог ${sfx}`, status: "DRAFT" },
    ],
  });

  const main = await prisma.newsPost.findFirst({ where: { tenantId, slug: S.main } });
  const bill = await prisma.bill.create({
    data: { tenantId, postId: main!.id, title: `Төсөл ${sfx}`, stage: 2, votesYes: 71, votesNo: 9 },
  });
  await prisma.billStage.createMany({
    data: [
      { tenantId, billId: bill.id, index: 2, note: "Гурав дахь", sources: ["https://a.mn"] },
      { tenantId, billId: bill.id, index: 0, note: "Нэг дэх", sources: [] },
    ],
  });
  await prisma.newsComment.createMany({
    data: [
      { tenantId, postId: main!.id, authorName: "Болд", body: "Хуучин сэтгэгдэл", createdAt: new Date(now - 7200_000) },
      { tenantId, postId: main!.id, authorName: "Сараа", body: "Шинэ сэтгэгдэл", createdAt: new Date(now - 60_000) },
      { tenantId, postId: main!.id, authorName: "Спам", body: "Нуусан", hidden: true },
    ],
  });
});

afterAll(async () => {
  const ids = (
    await prisma.newsPost.findMany({ where: { slug: { in: ALL } }, select: { id: true } })
  ).map((p) => p.id);
  await prisma.newsComment.deleteMany({ where: { postId: { in: ids } } });
  await prisma.billStage.deleteMany({ where: { bill: { postId: { in: ids } } } });
  await prisma.bill.deleteMany({ where: { postId: { in: ids } } });
  await prisma.newsPost.deleteMany({ where: { slug: { in: ALL } } });
  await prisma.$disconnect();
});

describe("articleView", () => {
  it("хуулийн төслийг шатуудтай нь, индексээр эрэмбэлж авна", async () => {
    const post = await postBySlug(S.main);
    const view = await articleView(post!);
    expect(view.bill?.stage).toBe(2);
    expect(view.bill?.votesYes).toBe(71);
    expect(view.bill?.steps.map((s) => s.index)).toEqual([0, 2]);
    expect(view.bill?.steps[1].sources).toEqual(["https://a.mn"]);
  });

  it("төсөлгүй мэдээнд null", async () => {
    const post = await postBySlug(S.older);
    expect((await articleView(post!)).bill).toBeNull();
  });

  it("нуугдсан сэтгэгдэл нийтэд гарахгүй", async () => {
    const view = await articleView((await postBySlug(S.main))!);
    expect(view.comments.map((c) => c.body)).not.toContain("Нуусан");
  });

  it("сэтгэгдэл шинэ нь эхэнд", async () => {
    const view = await articleView((await postBySlug(S.main))!);
    expect(view.comments[0].authorName).toBe("Сараа");
  });

  it("дараагийн мэдээ нь ӨӨРӨӨ биш", async () => {
    const view = await articleView((await postBySlug(S.main))!);
    expect(view.next?.slug).not.toBe(S.main);
  });

  it("санал болгоход дараагийн мэдээ давтагдахгүй", async () => {
    const view = await articleView((await postBySlug(S.main))!);
    expect(view.related.map((p) => p.slug)).not.toContain(view.next?.slug);
    expect(view.related.map((p) => p.slug)).not.toContain(S.main);
  });

  it("санал болгох нь дээд тал нь 3", async () => {
    const view = await articleView((await postBySlug(S.main))!);
    expect(view.related.length).toBeLessThanOrEqual(3);
  });

  it("нийтлэгдээгүй мэдээ хаана ч гарахгүй", async () => {
    const view = await articleView((await postBySlug(S.main))!);
    const shown = [view.next?.slug, ...view.related.map((p) => p.slug)];
    expect(shown).not.toContain(S.draft);
  });
});
