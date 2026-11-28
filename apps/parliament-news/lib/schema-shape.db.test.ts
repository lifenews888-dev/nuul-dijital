import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";

/**
 * Схемийн хэлбэрийн шалгуур.
 *
 * Prisma-ийн төрөл нь хөрвүүлэх үед л шалгагддаг; энэ нь САНД үнэхээр
 * багана үүссэн эсэхийг барина. `db push` хийгдээгүй орчинд (жишээ нь
 * шинэ хөгжүүлэгчийн компьютерт) тест нь чимээгүй өнгөрөхгүй.
 */
const sfx = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
const SLUG = `shape-${sfx}`;
let tenantId: string;

beforeAll(async () => {
  const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug(), active: true } });
  if (!tenant) throw new Error("tenant алга — эхлээд seed");
  tenantId = tenant.id;
});

afterAll(async () => {
  await prisma.banner.deleteMany({ where: { title: SLUG } });
  await prisma.newsPost.deleteMany({ where: { slug: SLUG } });
  await prisma.$disconnect();
});

describe("4-р шатны схем", () => {
  it("баннер медиа төрлөө хадгална", async () => {
    const made = await prisma.banner.create({
      data: {
        tenantId,
        title: SLUG,
        imageUrl: "https://x.public.blob.vercel-storage.com/a.mp4",
        kind: "video",
      },
    });
    expect(made.kind).toBe("video");
  });

  it("баннерын анхдагч төрөл нь зураг", async () => {
    const made = await prisma.banner.findFirst({ where: { title: SLUG } });
    expect(made).not.toBeNull();
    const plain = await prisma.banner.create({
      data: { tenantId, title: SLUG, imageUrl: "https://x.public.blob.vercel-storage.com/b.jpg" },
    });
    expect(plain.kind).toBe("image");
  });

  it("мэдээ сторины босоо медиатай", async () => {
    const post = await prisma.newsPost.create({
      data: {
        tenantId,
        slug: SLUG,
        title: `Хэлбэр ${sfx}`,
        date: new Date(),
        storyUrl: "https://x.public.blob.vercel-storage.com/s.mp4",
      },
    });
    expect(post.storyUrl).toBe("https://x.public.blob.vercel-storage.com/s.mp4");
  });
});
