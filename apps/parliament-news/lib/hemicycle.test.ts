import { describe, it, expect } from "vitest";
import { hemicycleDots, SEATS } from "./hemicycle";

describe("hemicycleDots", () => {
  it("УИХ-ын суудлын тоо 126", () => {
    expect(SEATS).toBe(126);
    expect(hemicycleDots(98)).toHaveLength(126);
  });

  it("дүүрсэн цэгийн тоо нь ирцтэй тэнцүү", () => {
    expect(hemicycleDots(98).filter((d) => d.filled)).toHaveLength(98);
    expect(hemicycleDots(0).filter((d) => d.filled)).toHaveLength(0);
    expect(hemicycleDots(126).filter((d) => d.filled)).toHaveLength(126);
  });

  it("суудлаас олон ирц ирвэл бүгд дүүрнэ, унахгүй", () => {
    expect(hemicycleDots(500).filter((d) => d.filled)).toHaveLength(126);
  });

  it("сөрөг ирцэд нэг ч дүүрэхгүй", () => {
    expect(hemicycleDots(-5).filter((d) => d.filled)).toHaveLength(0);
  });

  it("бүх цэг дээд хагаст, 220x116 хайрцагт багтана", () => {
    for (const d of hemicycleDots(98)) {
      expect(d.cy).toBeLessThanOrEqual(110.01);
      expect(d.cx).toBeGreaterThan(0);
      expect(d.cx).toBeLessThan(220);
      expect(d.cy).toBeGreaterThan(0);
    }
  });

  it("цэгүүд өнцгөөр эрэмбэлэгдсэн — зүүнээс баруун тийш", () => {
    const d = hemicycleDots(98);
    expect(d[0].cx).toBeLessThan(d[d.length - 1].cx);
  });

  it("дүүрсэн нь тарсан байна — зөвхөн зүүн тал биш", () => {
    const filled = hemicycleDots(63).filter((d) => d.filled);
    const left = filled.filter((d) => d.cx < 110).length;
    expect(left).toBeGreaterThan(10);
    expect(left).toBeLessThan(53);
  });
});
