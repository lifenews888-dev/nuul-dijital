import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomBytes } from "node:crypto";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import { getNewsRole } from "./trpc";
import { memberActor } from "./studio-session";

/**
 * «Нэвтэрсэн ≠ эрхтэй» — Review Focus #1-ийн суурь.
 *
 * nuul.mn-ийн өгөгдлийн санд хэрэглэгч байж болно, гэхдээ парламентын
 * редакцын гишүүн биш бол студи нь ТҮҮНД ЮУ Ч ХАРУУЛАХГҮЙ. Үүнийг цэвэр
 * тестээр барьж чадахгүй: шийдвэр нь `pn_tenant_members`-ийн мөрөөс,
 * `active` талбараас гардаг.
 *
 * `home-data.db.test.ts`-ийн загвараар: жинхэнэ tenant дотор түр хэрэглэгч
 * үүсгээд төгсгөлд устгана, tenant-ыг УСТГАХГҮЙ.
 */
/**
 * Файл тус бүрийн дагавар. `Date.now()` ДАНГААРАА хүрэхгүй: vitest нь
 * файлуудыг зэрэгцээ ажиллуулдаг тул хоёр файл нэг миллисекундэд эхэлж,
 * ИЖИЛ дагавар авч болно. Тэр үед нэг файлын `sfx`-ээр хийсэн хайлт
 * нөгөөгийн өгөгдлийг олж, тест үл баригдах болно (бодитоор тохиолдсон:
 * `posts.db.test.ts`-ийн «том/жижиг үсэг» тест 4 ажиллуулалтаас 2-т
 * улаан болов). Санамсаргүй сүүл нь түүнийг хаана.
 */
const sfx = `${Date.now().toString(36)}${randomBytes(3).toString("hex")}`;
const EMAIL = {
  member: `studio-member-${sfx}@test.local`,
  outsider: `studio-outsider-${sfx}@test.local`,
};

let tenantId: string;
let memberId: string;
let outsiderId: string;

beforeAll(async () => {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug() } });
  if (!tenant) throw new Error(`Tenant "${tenantSlug()}" олдсонгүй — seed ажиллуулна уу`);
  tenantId = tenant.id;

  const member = await prisma.user.create({
    data: { email: EMAIL.member, name: `Гишүүн ${sfx}` },
  });
  memberId = member.id;

  const outsider = await prisma.user.create({
    data: { email: EMAIL.outsider, name: `Гаднын хүн ${sfx}` },
  });
  outsiderId = outsider.id;

  await prisma.tenantMember.create({
    data: { tenantId, userId: memberId, role: "REPORTER" },
  });
});

afterAll(async () => {
  await prisma.tenantMember.deleteMany({ where: { userId: { in: [memberId, outsiderId] } } });
  await prisma.user.deleteMany({ where: { email: { in: [EMAIL.member, EMAIL.outsider] } } });
});

describe("getNewsRole", () => {
  it("идэвхтэй гишүүн үүрэгтэй", async () => {
    expect(await getNewsRole(tenantId, memberId)).toBe("REPORTER");
  });

  it("гишүүн биш хэрэглэгч эрхгүй", async () => {
    expect(await getNewsRole(tenantId, outsiderId)).toBeNull();
  });

  it("нэвтрээгүй хүн эрхгүй", async () => {
    expect(await getNewsRole(tenantId, undefined)).toBeNull();
  });

  it("идэвхгүй болгосон гишүүн эрхгүй", async () => {
    await prisma.tenantMember.update({
      where: { tenantId_userId: { tenantId, userId: memberId } },
      data: { active: false },
    });

    expect(await getNewsRole(tenantId, memberId)).toBeNull();

    await prisma.tenantMember.update({
      where: { tenantId_userId: { tenantId, userId: memberId } },
      data: { active: true },
    });
  });
});

describe("memberActor", () => {
  it("гишүүнээс Actor болгоно", async () => {
    expect(await memberActor(tenantId, memberId)).toEqual({
      userId: memberId,
      role: "REPORTER",
    });
  });

  it("гишүүн биш бол Actor ҮҮСЭХГҮЙ", async () => {
    expect(await memberActor(tenantId, outsiderId)).toBeNull();
  });

  it("нэвтрээгүй бол Actor үүсэхгүй", async () => {
    expect(await memberActor(tenantId, undefined)).toBeNull();
  });
});
