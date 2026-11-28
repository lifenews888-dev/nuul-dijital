import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import { forTenant } from "./tenant-db";
import { enqueueSocial } from "./social-queue";
import { dispatchSocial } from "./social-dispatch";

/**
 * Дараалал ба илгээлт.
 *
 * Сүлжээнд ХҮРЭХГҮЙ: Telegram-ын токен тавигдаагүй тул адаптер
 * `configured: false` буцаана. Яг тэр нь шалгамаар зүйл — тохируулаагүй
 * суваг нь FAILED биш SKIPPED болж, хязгааргүй дахин оролдохгүй.
 */
const sfx = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
let tenantId: string;
let postId = "";

beforeAll(async () => {
  const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug(), active: true } });
  if (!tenant) throw new Error("tenant алга — эхлээд seed");
  tenantId = tenant.id;

  const post = await prisma.newsPost.create({
    data: {
      tenantId,
      slug: `soc-${sfx}`,
      title: `Сошиал ${sfx}`,
      lead: "Товч агуулга",
      date: new Date(),
      channels: ["Сайт", "Facebook", "Telegram"],
    },
  });
  postId = post.id;
});

afterAll(async () => {
  await prisma.socialPost.deleteMany({ where: { postId } });
  await prisma.newsPost.deleteMany({ where: { id: postId } });
  await prisma.$disconnect();
});

describe("enqueueSocial", () => {
  it("«Сайт»-аас бусад сувагт мөр үүснэ", async () => {
    const post = await prisma.newsPost.findUniqueOrThrow({ where: { id: postId } });
    const made = await enqueueSocial(forTenant(tenantId), post, "https://parlamentnews.mn");
    expect(made).toBe(2);

    const rows = await prisma.socialPost.findMany({ where: { postId }, orderBy: { channel: "asc" } });
    expect(rows.map((r) => r.channel)).toEqual(["facebook", "telegram"]);
    expect(rows[0].text).toContain("https://parlamentnews.mn/news/");
  });

  it("ДАХИН нийтлэхэд давхардахгүй — нэг мэдээ хоёр удаа постлогдохгүй", async () => {
    const post = await prisma.newsPost.findUniqueOrThrow({ where: { id: postId } });
    const again = await enqueueSocial(forTenant(tenantId), post, "https://parlamentnews.mn");
    expect(again).toBe(0);
    expect(await prisma.socialPost.count({ where: { postId } })).toBe(2);
  });
});

describe("dispatchSocial", () => {
  it("тохируулаагүй суваг нь SKIPPED — оролдлого нэмэгдэхгүй", async () => {
    await dispatchSocial();

    const rows = await prisma.socialPost.findMany({ where: { postId } });
    for (const r of rows) {
      expect(r.status).toBe("SKIPPED");
      expect(r.attempts).toBe(0);
      expect(r.error ?? "").toContain("тохируулаагүй");
    }
  });

  it("SKIPPED мөрийг дахин авахгүй", async () => {
    const report = await dispatchSocial();
    const mine = await prisma.socialPost.findMany({ where: { postId } });
    expect(mine.every((r) => r.status === "SKIPPED")).toBe(true);
    expect(report.picked).toBeGreaterThanOrEqual(0);
  });
});
