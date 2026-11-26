import { describe, it, expect } from "vitest";
import {
  metrics,
  smoothstep,
  bump,
  along,
  relIndex,
  xOffset,
  bookPose,
  springStep,
  PERSPECTIVE,
} from "./shelf-geometry";

const m = metrics(400, 1280); // H=400, дэлгэц

describe("metrics", () => {
  it("artifact-ийн харьцаанууд", () => {
    expect(m.H).toBe(400);
    expect(m.ws).toBeCloseTo(100, 6); // H*0.25 — ном VHS-ээс зузаан
    expect(m.d).toBeCloseTo(248, 6); // H*0.62
    expect(m.gap).toBeCloseTo(14, 6); // H*0.035
    expect(m.U).toBeCloseTo(520, 6); // H*1.3 (дэлгэц)
  });

  it("утсан дээр U нь H*1.05", () => {
    expect(metrics(400, 600).U).toBeCloseTo(420, 6);
  });

  it("perspective нь 1400", () => {
    expect(PERSPECTIVE).toBe(1400);
  });

  it("xs нь өсөн нэмэгдэх интеграл", () => {
    expect(m.xs[0]).toBe(0);
    for (let i = 1; i < m.xs.length; i++) {
      expect(m.xs[i]).toBeGreaterThan(m.xs[i - 1]);
    }
  });

  it("probe өндөр 0 байсан ч унахгүй", () => {
    const z = metrics(0, 1280);
    expect(Number.isFinite(z.U)).toBe(true);
    expect(z.xs.length).toBeGreaterThan(0);
    expect(z.xs.every(Number.isFinite)).toBe(true);
  });
});

describe("smoothstep", () => {
  it("0, 1 дээр тогтвортой, дунд нь 0.5", () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 6);
  });
});

describe("bump", () => {
  it("|r| >= 1 бол ±0.5", () => {
    expect(bump(1)).toBeCloseTo(0.5, 6);
    expect(bump(-3)).toBeCloseTo(-0.5, 6);
  });
  it("0 дээр 0, сондгой функц", () => {
    expect(bump(0)).toBeCloseTo(0, 6);
    expect(bump(0.4)).toBeCloseTo(-bump(-0.4), 6);
  });
});

describe("along", () => {
  it("төвд 0", () => {
    expect(along(0, m)).toBeCloseTo(0, 6);
  });
  it("нэг зүгт өсөн нэмэгдэнэ", () => {
    expect(along(1, m)).toBeGreaterThan(along(0.5, m));
    expect(along(2, m)).toBeGreaterThan(along(1, m));
  });
  it("нээлттэй хавтас хөршүүдийг түлхэж тараана", () => {
    // |r|<1 дээр нэмэлт (d - ws + 1.4*gap) * B(r) гишүүн ажиллана
    expect(along(1, m)).toBeGreaterThan(1 * (m.ws + m.gap));
  });
});

describe("relIndex", () => {
  it("тойргийн хамгийн ойрын зайг өгнө", () => {
    expect(relIndex(0, 0, 12)).toBe(0);
    expect(relIndex(1, 0, 12)).toBe(1);
    expect(relIndex(11, 0, 12)).toBe(-1);
  });
  it("бутархай байрлалд ажиллана", () => {
    expect(relIndex(0, 0.5, 12)).toBeCloseTo(-0.5, 6);
  });
  it("total 0 эсвэл 1 бол унахгүй", () => {
    expect(Number.isFinite(relIndex(0, 0, 0))).toBe(true);
    expect(Number.isFinite(relIndex(0, 0, 1))).toBe(true);
  });
});

describe("xOffset", () => {
  it("0 дээр 0, сондгой", () => {
    expect(xOffset(0, m)).toBe(0);
    expect(xOffset(-100, m)).toBeCloseTo(-xOffset(100, m), 6);
  });
  it("хол номнууд дэлгэцэн дээр нягтарна", () => {
    // Нэмэгдэл буурна: интегралын дор перспективийн масштаб багасна
    const a = xOffset(100, m) - xOffset(50, m);
    const b = xOffset(1000, m) - xOffset(950, m);
    expect(b).toBeLessThan(a);
  });
});

describe("bookPose", () => {
  const base = { s: 0, total: 36, m, lift: 0, tiltX: 0, tiltY: 0 };

  it("идэвхтэй ном нь -90 градус эргэж хавтсаа харуулна", () => {
    expect(bookPose({ ...base, index: 0 }).ry).toBeCloseTo(-90, 1);
  });

  it("хөрш номнууд нуруугаараа үлдэнэ (эргэлт 26 градусын дотор)", () => {
    const p = bookPose({ ...base, index: 2 });
    expect(Math.abs(p.ry)).toBeLessThanOrEqual(26.001);
  });

  /**
   * Нуух хязгаар нь нумын урт `|u| > U*1.95`, индекс биш. Ном зузаан
   * (ws = H·0.25) тул VHS-ээс цөөн ном багтана: H=400 үед 8 дахь ном нь
   * u≈996 (хязгаар 1014) — хараахан харагдана, 9 дэх нь алга болно.
   */
  it("ойрын номнууд харагдаж, хол нь нуугдана", () => {
    expect(bookPose({ ...base, index: 0 }).hidden).toBe(false);
    expect(bookPose({ ...base, index: 4 }).hidden).toBe(false);
    expect(bookPose({ ...base, index: 8 }).hidden).toBe(false);
    expect(bookPose({ ...base, index: 9 }).hidden).toBe(true);
    expect(bookPose({ ...base, index: 14 }).hidden).toBe(true);
  });

  it("нуух нь хоёр тал руу тэгш хэмтэй", () => {
    expect(bookPose({ ...base, index: 36 - 9 }).hidden).toBe(true);
    expect(bookPose({ ...base, index: 36 - 8 }).hidden).toBe(false);
  });

  it("идэвхтэй ном хамгийн өндөр zIndex-тэй", () => {
    expect(bookPose({ ...base, index: 0 }).zIndex).toBeGreaterThan(
      bookPose({ ...base, index: 3 }).zIndex,
    );
  });

  it("сүүдэр нь artifact-ийн хязгаарт", () => {
    const p = bookPose({ ...base, index: 1 });
    expect(p.shadeSpine).toBeLessThanOrEqual(0.6);
    expect(p.shadeCover).toBeGreaterThanOrEqual(0);
    expect(p.shadeBack).toBeCloseTo(0.5, 6);
  });

  it("идэвхтэй номны хавтас сүүдэргүй, нуруу нь сүүдэртэй", () => {
    const p = bookPose({ ...base, index: 0 });
    expect(p.shadeCover).toBeCloseTo(0, 6);
    expect(p.shadeSpine).toBeGreaterThan(0);
  });

  it("бүх утга тоон, NaN байхгүй", () => {
    for (let i = 0; i < 12; i++) {
      const p = bookPose({ ...base, index: i });
      for (const v of [p.x, p.y, p.z, p.rx, p.ry, p.zIndex]) {
        expect(Number.isFinite(v)).toBe(true);
      }
    }
  });

  it("нэг л ном байхад унахгүй", () => {
    const p = bookPose({ ...base, index: 0, total: 1 });
    expect(Number.isFinite(p.x)).toBe(true);
    expect(p.hidden).toBe(false);
  });

  it("ном огт байхгүй үед ч унахгүй", () => {
    const p = bookPose({ ...base, index: 0, total: 0 });
    expect(Number.isFinite(p.x)).toBe(true);
  });

  it("хулганы налалт зөвхөн идэвхтэй номонд хүрнэ", () => {
    const active = bookPose({ ...base, index: 0, tiltX: 5, tiltY: 8 });
    const far = bookPose({ ...base, index: 3, tiltX: 5, tiltY: 8 });
    expect(active.rx).toBeCloseTo(5, 6);
    expect(far.rx).toBeCloseTo(0, 6);
  });

  it("хөвөх өргөлт номыг дээш хөдөлгөнө", () => {
    const flat = bookPose({ ...base, index: 2 });
    const lifted = bookPose({ ...base, index: 2, lift: 1 });
    expect(lifted.y).toBeLessThan(flat.y);
  });
});

describe("springStep", () => {
  it("зорилго руу ойртоно, давж гарахгүй", () => {
    const next = springStep(0, 10, 0.016, false);
    expect(next).toBeGreaterThan(0);
    expect(next).toBeLessThan(10);
  });
  it("чирэх үед илүү хурдан", () => {
    expect(springStep(0, 10, 0.016, true)).toBeGreaterThan(
      springStep(0, 10, 0.016, false),
    );
  });
  it("dt нь 0.05-аар хязгаарлагдана — таб руу буцахад үсрэхгүй", () => {
    expect(springStep(0, 10, 5, false)).toBeCloseTo(springStep(0, 10, 0.05, false), 6);
  });
  it("аль хэдийн зорилго дээр бол хөдлөхгүй", () => {
    expect(springStep(7, 7, 0.016, false)).toBeCloseTo(7, 6);
  });
});
