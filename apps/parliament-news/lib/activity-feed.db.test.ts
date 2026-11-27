import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import { recentActivity, ACTIVITY_MAX } from "./activity-feed";

/**
 * Үйл явдлын бүртгэлийн уншилт.
 *
 * `NewsActivity` нь `User`-тэй relation-гүй (`userId` нь зүгээр String):
 * схем нь устгасан хэрэглэгчийн бүртгэлийг хадгалахын тул ийм. Иймд
 * нэрийг ТУСАД НЬ уншина — admin.html-ийн `resolveNames()` ч мөн адил.
 * Энэ тест нь нэр ШИЙДЭГДЭЖ байгааг, шийдэгдэхгүй үед мөр ХООСРОХГҮЙ
 * байгааг барина.
 */
const sfx = Date.now().toString(36);
const EMAIL = { me: `af-me-${sfx}@test.local` };
const NOTE = { mine: `af-note-${sfx}`, orphan: `af-orphan-${sfx}` };

let tenantId: string;
let foreignTenantId: string;
let myId: string;

beforeAll(async () => {
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug() } });
  if (!tenant) throw new Error(`Tenant "${tenantSlug()}" олдсонгүй — seed ажиллуулна уу`);
  tenantId = tenant.id;

  const foreign = await prisma.tenant.create({
    data: { slug: `af-foreign-${sfx}`, name: `Гадны сайт ${sfx}` },
    select: { id: true },
  });
  foreignTenantId = foreign.id;

  const me = await prisma.user.create({
    data: { email: EMAIL.me, name: `Болд ${sfx}` },
  });
  myId = me.id;

  await prisma.newsActivity.createMany({
    data: [
      { tenantId, postId: null, userId: myId, action: "publish", note: NOTE.mine },
      /** Хэрэглэгч нь устсан, эсвэл хэзээ ч байгаагүй — мөр үлдэх ёстой */
      { tenantId, postId: null, userId: "user-that-does-not-exist", action: "delete", note: NOTE.orphan },
      { tenantId: foreignTenantId, postId: null, userId: myId, action: "publish", note: "ГАДНЫ" },
    ],
  });
});

afterAll(async () => {
  await prisma.newsActivity.deleteMany({
    where: { tenantId: { in: [tenantId, foreignTenantId] }, note: { in: [...Object.values(NOTE), "ГАДНЫ"] } },
  });
  await prisma.user.deleteMany({ where: { email: { in: Object.values(EMAIL) } } });
  await prisma.tenant.delete({ where: { id: foreignTenantId } });
});

describe("recentActivity", () => {
  it("хэрэглэгчийн нэрийг шийднэ", async () => {
    const rows = await recentActivity(tenantId);
    const mine = rows.find((r) => r.note === NOTE.mine);
    expect(mine?.userName).toBe(`Болд ${sfx}`);
    expect(mine?.action).toBe("publish");
  });

  /** Нэр олдохгүй бол мөр АЛГА БОЛОХ ЁСГҮЙ — «хэзээ, юу» нь хэвээр үнэ цэнтэй */
  it("нэр олдохгүй мөр ч жагсаалтад үлдэнэ", async () => {
    const rows = await recentActivity(tenantId);
    const orphan = rows.find((r) => r.note === NOTE.orphan);
    expect(orphan).toBeDefined();
    expect(orphan?.userName).toBeNull();
  });

  it("шинэ нь дээр", async () => {
    const rows = await recentActivity(tenantId);
    for (let i = 1; i < rows.length; i += 1) {
      expect(rows[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(rows[i].createdAt.getTime());
    }
  });

  it("өөр tenant-ийн бүртгэл харагдахгүй", async () => {
    const rows = await recentActivity(tenantId);
    expect(rows.map((r) => r.note)).not.toContain("ГАДНЫ");
  });

  it("хязгаартай", async () => {
    const rows = await recentActivity(tenantId);
    expect(rows.length).toBeLessThanOrEqual(ACTIVITY_MAX);
  });

  it("хязгаарыг багасгаж болно", async () => {
    const rows = await recentActivity(tenantId, 1);
    expect(rows).toHaveLength(1);
  });

  it("байхгүй tenant-д хоосон", async () => {
    expect(await recentActivity("tenant-that-does-not-exist")).toEqual([]);
  });

  /** Нэг хэрэглэгчийн олон мөрт нэг л уншилт — N+1 болох ёсгүй */
  it("нэрийг нэг уншилтаар шийднэ", async () => {
    await prisma.newsActivity.createMany({
      data: [
        { tenantId, postId: null, userId: myId, action: "approve", note: NOTE.mine },
        { tenantId, postId: null, userId: myId, action: "submit", note: NOTE.mine },
      ],
    });
    const rows = await recentActivity(tenantId);
    const named = rows.filter((r) => r.note === NOTE.mine);
    expect(named.length).toBeGreaterThanOrEqual(3);
    expect(named.every((r) => r.userName === `Болд ${sfx}`)).toBe(true);
  });
});
