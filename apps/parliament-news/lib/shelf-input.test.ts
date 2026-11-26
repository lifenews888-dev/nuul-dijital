import { describe, it, expect } from "vitest";
import { wheelStep, clickAction, DRAG_THRESHOLD, dragMoved } from "./shelf-input";

/** Тавиурын хэвтээ зурвас: дэлгэцийн дунд */
const band = { top: 300, bottom: 700 };
const base = { scrollY: 0, pointerY: 500, ...band, step: 40 };

describe("wheelStep", () => {
  it("зурвас дотор босоо дугуй нь номыг эргүүлнэ", () => {
    const n = wheelStep({ deltaX: 0, deltaY: 100 }, base);
    expect(n).not.toBeNull();
    expect(n).toBeGreaterThan(0);
  });

  /**
   * Artifact-ийн `if(scrollY>4) return` — хуудас гүйж эхэлмэгц дугуй нь
   * зөвхөн хуудсыг гүйлгэнэ. Үгүй бол урсгал руу бууж байхад тавиур
   * эргэлдэж, өөр мэдээн дээр очно.
   */
  it("хуудас гүйж эхэлсэн бол юу ч хийхгүй", () => {
    expect(wheelStep({ deltaX: 0, deltaY: 100 }, { ...base, scrollY: 5 })).toBeNull();
    expect(wheelStep({ deltaX: 0, deltaY: 100 }, { ...base, scrollY: 400 })).toBeNull();
  });

  it("4px хүртэл гүйлт нь зөвшөөрөгдөнө", () => {
    expect(wheelStep({ deltaX: 0, deltaY: 100 }, { ...base, scrollY: 4 })).not.toBeNull();
  });

  /** Artifact: босоо дугуй нь зөвхөн заагч зурвас дотор байхад */
  it("заагч зурваснаас гадуур байвал босоо дугуй хуудсыг гүйлгэнэ", () => {
    expect(wheelStep({ deltaX: 0, deltaY: 100 }, { ...base, pointerY: 299 })).toBeNull();
    expect(wheelStep({ deltaX: 0, deltaY: 100 }, { ...base, pointerY: 701 })).toBeNull();
  });

  it("хэвтээ дугуй нь зурваснаас гадуур ч ажиллана", () => {
    const n = wheelStep({ deltaX: 120, deltaY: 0 }, { ...base, pointerY: 50 });
    expect(n).not.toBeNull();
    expect(n).toBeGreaterThan(0);
  });

  it("том нь ялна: хэвтээ > босоо", () => {
    const h = wheelStep({ deltaX: 200, deltaY: 10 }, base);
    const v = wheelStep({ deltaX: 10, deltaY: 200 }, base);
    expect(h).toBeCloseTo(v as number, 6);
  });

  it("эсрэг тийш", () => {
    expect(wheelStep({ deltaX: 0, deltaY: -100 }, base)).toBeLessThan(0);
  });

  it("алхам нь тэг бол хуваагдахгүй", () => {
    expect(wheelStep({ deltaX: 0, deltaY: 100 }, { ...base, step: 0 })).toBeNull();
  });
});

describe("clickAction", () => {
  /** Artifact: `Math.abs(r) < .5` бол нээнэ, үгүй бол эргүүлнэ */
  it("урдах ном дээр дарвал мэдээ нээнэ", () => {
    expect(clickAction(0)).toEqual({ kind: "open" });
    expect(clickAction(0.4)).toEqual({ kind: "open" });
    expect(clickAction(-0.49)).toEqual({ kind: "open" });
  });

  it("хөрш ном дээр дарвал түүнийг урагш эргүүлнэ", () => {
    expect(clickAction(1)).toEqual({ kind: "rotate", by: 1 });
    expect(clickAction(-2)).toEqual({ kind: "rotate", by: -2 });
  });

  it("бутархай байрлалыг бүхэлчилнэ", () => {
    expect(clickAction(2.3)).toEqual({ kind: "rotate", by: 2 });
    expect(clickAction(-1.8)).toEqual({ kind: "rotate", by: -2 });
  });

  it("хил дээр эргүүлнэ, нээхгүй", () => {
    expect(clickAction(0.5)).toEqual({ kind: "rotate", by: 1 });
  });
});

describe("dragMoved", () => {
  it("босгоос бага хөдөлгөөн нь дарлат хэвээр", () => {
    expect(dragMoved(100, 100 + DRAG_THRESHOLD)).toBe(false);
    expect(dragMoved(100, 100 - DRAG_THRESHOLD)).toBe(false);
  });

  it("босгоос их бол чирэлт", () => {
    expect(dragMoved(100, 100 + DRAG_THRESHOLD + 1)).toBe(true);
    expect(dragMoved(100, 100 - DRAG_THRESHOLD - 1)).toBe(true);
  });
});
