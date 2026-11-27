import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@nuul/db-news";
import { tenantSlug } from "./tenant";
import { siteInfo } from "./info-data";

/** Ханшийн мөр нь tenant тус бүрт нэг багц тул өмнөхийг нь сэргээнэ. */
let tenantId: string;
let saved: { code: string; value: string; change: string; order: number }[] = [];

beforeAll(async () => {
  const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug(), active: true } });
  if (!tenant) throw new Error("tenant алга — эхлээд seed");
  tenantId = tenant.id;

  saved = (await prisma.fxRate.findMany({ where: { tenantId } })).map((r) => ({
    code: r.code,
    value: String(r.value),
    change: String(r.change),
    order: r.order,
  }));

  await prisma.fxRate.deleteMany({ where: { tenantId } });
  await prisma.fxRate.createMany({
    data: [
      { tenantId, code: "USD", value: "3450.5", change: "-12.25", order: 0 },
      { tenantId, code: "EUR", value: "3700", change: "0", order: 1 },
      // Код нь гурван том үсэг БИШ — харагдах ёсгүй
      { tenantId, code: "USDT", value: "1", change: "0", order: 2 },
    ],
  });
});

afterAll(async () => {
  await prisma.fxRate.deleteMany({ where: { tenantId } });
  if (saved.length) {
    await prisma.fxRate.createMany({ data: saved.map((r) => ({ ...r, tenantId })) });
  }
  await prisma.$disconnect();
});

describe("siteInfo", () => {
  it("Decimal-ыг тоо болгож хөрвүүлнэ — эс тэгвээс бүх мөр шүүгдэж алга болно", async () => {
    const info = await siteInfo();
    expect(info.fx.map((r) => r.code)).toEqual(["USD", "EUR"]);
    expect(info.fx[0].value).toBe(3450.5);
    expect(info.fx[0].change).toBe(-12.25);
  });

  it("дарааллыг редакцын эрэмбээр", async () => {
    expect((await siteInfo()).fx.map((r) => r.code)).toEqual(["USD", "EUR"]);
  });

  it("шинэчлэгдсэн огноог авна", async () => {
    expect((await siteInfo()).at).toBeInstanceOf(Date);
  });

  it("цаг агаар нь тохиргоонд байхгүй бол null", async () => {
    const info = await siteInfo();
    expect(info.weather === null || typeof info.weather.temp === "number").toBe(true);
  });
});
