import { describe, it, expect } from "vitest";
import {
  yearFraction,
  monthMarks,
  dotTarget,
  dotStep,
  nearestIndex,
  shortestStep,
  DOT_JUMP,
  MONTH_LABELS,
  WEEK_TICKS,
} from "./timeline";

describe("yearFraction", () => {
  it("1-р сарын 1 нь 0", () => {
    expect(yearFraction(new Date("2026-01-01T00:00:00Z"))).toBeCloseTo(0, 3);
  });

  it("12-р сарын 31 нь 1 орчим", () => {
    expect(yearFraction(new Date("2026-12-31T00:00:00Z"))).toBeCloseTo(1, 2);
  });

  it("оны дунд нь 0.5 орчим", () => {
    expect(yearFraction(new Date("2026-07-02T00:00:00Z"))).toBeCloseTo(0.5, 2);
  });

  it("өсөн нэмэгдэнэ", () => {
    const a = yearFraction(new Date("2026-03-01T00:00:00Z"));
    const b = yearFraction(new Date("2026-09-01T00:00:00Z"));
    expect(b).toBeGreaterThan(a);
  });

  it("өндөр жилд ч 0..1 хооронд", () => {
    const f = yearFraction(new Date("2028-02-29T00:00:00Z"));
    expect(f).toBeGreaterThan(0);
    expect(f).toBeLessThan(1);
  });

  it("өөр оны огноо ч өөрийн онд харьцуулагдана", () => {
    // Шугам нь мэдээний оныг харуулна — 2027 оны 1-р сар нь дахиад 0 орчим
    expect(yearFraction(new Date("2027-01-01T00:00:00Z"))).toBeCloseTo(0, 3);
  });

  it("хязгаараас хэтрэхгүй", () => {
    for (const d of ["2026-01-01", "2026-06-15", "2026-12-31"]) {
      const f = yearFraction(new Date(`${d}T00:00:00Z`));
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });
});

describe("шугамын тогтмолууд", () => {
  it("12 сарын шошго, artifact-ийн бичиглэлээр", () => {
    expect(MONTH_LABELS).toHaveLength(12);
    expect(MONTH_LABELS[0]).toBe("1-р сар");
    expect(MONTH_LABELS[11]).toBe("12-р сар");
  });

  it("53 долоо хоногийн зураас (0..52)", () => {
    expect(WEEK_TICKS).toBe(52);
  });
});

/**
 * Artifact-ийн frame() (index.html:810): цэг нь хоёр мэдээний хооронд
 * шугаман дүүрнэ, харин тойрог хаагдах үед (сүүлийн ном) хамгийн ойрын
 * мэдээ руу шууд үсэрнэ — өөрөөр бол бүх шугамыг хөндлөн гүйнэ.
 */
describe("dotTarget", () => {
  const f = [0.1, 0.4, 0.9];

  it("ном дээр яг зогсвол тэр мэдээний огноо", () => {
    expect(dotTarget(f, 0)).toBeCloseTo(0.1, 6);
    expect(dotTarget(f, 1)).toBeCloseTo(0.4, 6);
  });

  it("хоёр номын хооронд шугаман дүүрнэ", () => {
    expect(dotTarget(f, 0.5)).toBeCloseTo(0.25, 6);
    expect(dotTarget(f, 1.25)).toBeCloseTo(0.4 + (0.9 - 0.4) * 0.25, 6);
  });

  it("сүүлийн номоос эхнийх руу үсэрнэ, хөндлөн гүйхгүй", () => {
    expect(dotTarget(f, 2.2)).toBeCloseTo(0.9, 6);
    expect(dotTarget(f, 2.8)).toBeCloseTo(0.1, 6);
  });

  it("тойргийн хуулбарууд ижил байрлал өгнө", () => {
    expect(dotTarget(f, 3.5)).toBeCloseTo(dotTarget(f, 0.5), 6);
    expect(dotTarget(f, 6.5)).toBeCloseTo(dotTarget(f, 0.5), 6);
  });

  it("хоосон жагсаалтад 0", () => {
    expect(dotTarget([], 2)).toBe(0);
  });
});

describe("dotStep", () => {
  it("ойрхон бол амарч хөдөлнө", () => {
    const next = dotStep(0.2, 0.3, 1 / 60);
    expect(next).toBeGreaterThan(0.2);
    expect(next).toBeLessThan(0.3);
    expect(next).toBeCloseTo(0.2 + 0.1 * (1 - Math.exp(-14 / 60)), 9);
  });

  it("хэт хол бол шууд үсэрнэ — шугамыг хөндлөн гүйхгүй", () => {
    expect(DOT_JUMP).toBe(0.17);
    expect(dotStep(0.1, 0.9, 1 / 60)).toBe(0.9);
  });

  it("үсрэх хязгаарын дор амарна", () => {
    expect(dotStep(0.1, 0.1 + DOT_JUMP - 0.001, 1 / 60)).not.toBe(0.1 + DOT_JUMP - 0.001);
  });
});

describe("monthMarks", () => {
  it("12 тэмдэг, шошготой", () => {
    const marks = monthMarks(2026);
    expect(marks).toHaveLength(12);
    expect(marks[0]).toEqual({ label: "1-р сар", fraction: 0 });
    expect(marks[11].fraction).toBeCloseTo(334 / 365, 3);
  });
});

/**
 * Цагийн шугам дээр дарахад (artifact index.html:972) хамгийн ойрын мэдээ
 * руу, тойргийн БОГИНО замаар явна.
 */
describe("nearestIndex", () => {
  const f = [0.1, 0.4, 0.9];

  it("хамгийн ойрын мэдээг олно", () => {
    expect(nearestIndex(f, 0.12)).toBe(0);
    expect(nearestIndex(f, 0.5)).toBe(1);
    expect(nearestIndex(f, 0.95)).toBe(2);
  });

  it("яг хооронд нь бол эхнийхийг", () => {
    expect(nearestIndex([0.2, 0.4], 0.3)).toBe(0);
  });

  it("хоосон жагсаалтад 0", () => {
    expect(nearestIndex([], 0.5)).toBe(0);
  });
});

describe("shortestStep", () => {
  it("ойрхон бол шууд", () => {
    expect(shortestStep(0, 2, 12)).toBe(2);
    expect(shortestStep(3, 5, 12)).toBe(2);
  });

  it("тойргийн хагасаас хол бол буруу тийшээ — богино зам", () => {
    expect(shortestStep(0, 10, 12)).toBe(-2);
    expect(shortestStep(1, 11, 12)).toBe(-2);
  });

  it("ижил бол хөдлөхгүй", () => {
    expect(shortestStep(4, 4, 12)).toBe(0);
  });

  it("хагас дээр бол урагш", () => {
    expect(shortestStep(0, 6, 12)).toBe(6);
  });

  it("тоо нь өөр байсан ч хагасаар шийднэ", () => {
    expect(shortestStep(0, 5, 6)).toBe(-1);
    expect(shortestStep(0, 3, 6)).toBe(3);
  });
});
