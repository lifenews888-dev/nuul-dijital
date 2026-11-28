import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import { banners } from "./banner-data";

/** Баннер нь tenant тус бүрт цөөн мөр тул өмнөхийг нь бүрэн сэргээнэ. */
const sfx = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
const BLOB = "https://pn.public.blob.vercel-storage.com";
let tenantId: string;
let kept: { id: string }[] = [];

beforeAll(async () => {
  const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug(), active: true } });
  if (!tenant) throw new Error("tenant алга — эхлээд seed");
  tenantId = tenant.id;

  kept = await prisma.banner.findMany({ where: { tenantId }, select: { id: true } });

  const day = 86_400_000;
  await prisma.banner.createMany({
    data: [
      { tenantId, title: `${sfx}-home`, imageUrl: `${BLOB}/h.jpg`, placement: "home", order: 0 },
      { tenantId, title: `${sfx}-both`, imageUrl: `${BLOB}/b.jpg`, placement: "both", order: 1 },
      {
        tenantId,
        title: `${sfx}-done`,
        imageUrl: `${BLOB}/d.jpg`,
        placement: "all",
        endsOn: new Date(Date.now() - 3 * day),
        order: 2,
      },
      {
        tenantId,
        title: `${sfx}-video`,
        imageUrl: `${BLOB}/v`,
        kind: "video",
        placement: "all",
        order: 3,
      },
    ],
  });
});

afterAll(async () => {
  await prisma.banner.deleteMany({
    where: { tenantId, id: { notIn: kept.map((b) => b.id) } },
  });
  await prisma.$disconnect();
});

const mine = <T extends { title: string | null }>(rows: T[]) =>
  rows.filter((b) => b.title?.startsWith(sfx));

describe("нийтийн баннерын уншилт", () => {
  it("нүүрэнд home, both, видео гарна", async () => {
    const got = mine(await banners("home"));
    expect(got.map((b) => b.title)).toEqual([`${sfx}-home`, `${sfx}-both`, `${sfx}-video`]);
  });

  it("нийтлэлд both ГАРАХГҮЙ", async () => {
    const got = mine(await banners("article"));
    expect(got.map((b) => b.title)).toEqual([`${sfx}-video`]);
  });

  it("хугацаа нь дууссан зар хаана ч гарахгүй", async () => {
    for (const place of ["home", "article", "side"] as const) {
      expect(mine(await banners(place)).some((b) => b.title === `${sfx}-done`)).toBe(false);
    }
  });

  it("хадгалсан медиа төрөл нь уншилтаар дамжина", async () => {
    const v = mine(await banners("home")).find((b) => b.title === `${sfx}-video`);
    expect(v?.kind).toBe("video");
  });
});
