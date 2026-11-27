import { describe, it, expect } from "vitest";
import {
  CHART_RANGES,
  dayKeys,
  bucketActivity,
  chartMax,
  greeting,
  type ActivityPoint,
} from "./dashboard-chart";

/**
 * Самбарын графикийн цэвэр тооцоо.
 *
 * Эдгээрийг компонентод шууд бичвэл тест хүрэхгүй: хоосон өдөр алга
 * болох, цагийн бүсээр нэг өдөр гулсах, бүх утга тэг үед хуваалт нь
 * тэгд хуваагдах — бүгд яг энд гардаг.
 */
const AT = (iso: string) => new Date(iso);

describe("CHART_RANGES", () => {
  it("artifact-ийн гурван хугацаа", () => {
    expect(CHART_RANGES.map((r) => r.days)).toEqual([14, 30, 90]);
    expect(CHART_RANGES.map((r) => r.label)).toEqual(["14 хоног", "30 хоног", "90 хоног"]);
  });
});

describe("dayKeys", () => {
  const now = AT("2026-11-27T05:00:00Z");

  it("өнөөдрөөр төгсөнө", () => {
    const keys = dayKeys(14, now);
    expect(keys[keys.length - 1]).toBe("2026-11-27");
  });

  it("хоногийн тоогоор", () => {
    expect(dayKeys(14, now)).toHaveLength(14);
    expect(dayKeys(90, now)).toHaveLength(90);
  });

  it("эхлэл нь зөв өдөр", () => {
    expect(dayKeys(14, now)[0]).toBe("2026-11-14");
  });

  /** УБ нь UTC+8: 05:00 UTC нь аль хэдийн 13:00, өнөөдөр нь 11-27 */
  it("Улаанбаатарын өдрөөр — UTC шөнө дунд гулсуулахгүй", () => {
    const lateUtc = AT("2026-11-26T20:00:00Z"); // УБ: 11-27 04:00
    const keys = dayKeys(3, lateUtc);
    expect(keys[keys.length - 1]).toBe("2026-11-27");
  });
});

describe("bucketActivity", () => {
  const now = AT("2026-11-27T05:00:00Z");
  const rows: ActivityPoint[] = [
    { action: "publish", createdAt: AT("2026-11-27T02:00:00Z") },
    { action: "publish", createdAt: AT("2026-11-27T03:00:00Z") },
    { action: "save", createdAt: AT("2026-11-27T04:00:00Z") },
    { action: "submit", createdAt: AT("2026-11-26T04:00:00Z") },
    /** Хугацаанаас гадуур — тоологдох ёсгүй */
    { action: "publish", createdAt: AT("2026-10-01T04:00:00Z") },
  ];

  it("өдөр бүрийн баганыг өгнө — хоосон өдөр ч", () => {
    const points = bucketActivity(rows, 14, now);
    expect(points).toHaveLength(14);
    expect(points.every((p) => typeof p.published === "number")).toBe(true);
  });

  it("нийтлэлийг тусад нь тоолно", () => {
    const points = bucketActivity(rows, 14, now);
    const today = points[points.length - 1];
    expect(today.published).toBe(2);
  });

  /** Засвар, илгээлт, батлалт бүгд «бусад» багананд */
  it("бусад үйлдлийг нэг баганад", () => {
    const today = bucketActivity(rows, 14, now).at(-1)!;
    expect(today.other).toBe(1);
  });

  it("хугацаанаас гадуурхыг хаяна", () => {
    const total = bucketActivity(rows, 14, now).reduce((n, p) => n + p.published + p.other, 0);
    expect(total).toBe(4);
  });

  it("өчигдрийн мөр өчигдрийн баганад", () => {
    const points = bucketActivity(rows, 14, now);
    expect(points.at(-2)!.other).toBe(1);
  });

  it("мөргүй бол бүх багана тэг, хоосон массив БИШ", () => {
    const points = bucketActivity([], 14, now);
    expect(points).toHaveLength(14);
    expect(points.every((p) => p.published === 0 && p.other === 0)).toBe(true);
  });
});

describe("chartMax", () => {
  /** Бүх утга тэг үед ч 0-д хуваахгүй — тэнхлэг нь 1 */
  it("бүгд тэг бол нэг", () => {
    expect(chartMax([{ day: "d", published: 0, other: 0 }])).toBe(1);
  });

  it("хамгийн их нийлбэрийг олно", () => {
    expect(
      chartMax([
        { day: "a", published: 2, other: 1 },
        { day: "b", published: 1, other: 1 },
      ]),
    ).toBe(3);
  });

  it("хоосон жагсаалтад нэг", () => {
    expect(chartMax([])).toBe(1);
  });
});

describe("greeting", () => {
  it("өглөө, өдөр, орой", () => {
    expect(greeting(6)).toBe("Өглөөний мэнд");
    expect(greeting(11)).toBe("Өдрийн мэнд");
    expect(greeting(14)).toBe("Өдрийн мэнд");
    expect(greeting(19)).toBe("Оройн мэнд");
    expect(greeting(2)).toBe("Сайн байна уу");
  });
});
