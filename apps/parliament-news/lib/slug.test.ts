import { describe, it, expect } from "vitest";
import { toSlug, uniqueSlug, nextSlug, changeSlug } from "./slug";

describe("toSlug", () => {
  it("кирилл гарчгийг латин slug болгоно (ө→o, ү→u)", () => {
    expect(toSlug("Чуулган хуралдлаа")).toBe("chuulgan-khuraldlaa");
    expect(toSlug("Өнөөдөр парламентад")).toBe("onoodor-parlamentad");
    expect(toSlug("Хуулийн мэдээ")).toBe("khuuliin-medee");
    expect(toSlug("Үндсэн хууль")).toBe("undsen-khuuli");
  });
  it("тэмдэгт, давхар зай, уртыг цэвэрлэнэ", () => {
    expect(toSlug("  Төсөв: 2027 он!  ")).toBe("tosov-2027-on");
    expect(toSlug("а".repeat(120)).length).toBeLessThanOrEqual(80);
  });
  it("хоосон үр дүнд нөөц нэр буцаана", () => {
    expect(toSlug("!!! ???")).toBe("medee");
    expect(toSlug("")).toBe("medee");
  });
});

describe("uniqueSlug", () => {
  it("давхардсан бол тоо нэмнэ", () => {
    expect(uniqueSlug("tosov", [])).toBe("tosov");
    expect(uniqueSlug("tosov", ["tosov"])).toBe("tosov-2");
    expect(uniqueSlug("tosov", ["tosov", "tosov-2"])).toBe("tosov-3");
  });
});

describe("nextSlug", () => {
  it("ноорог үед гарчгаас дахин тооцно", () => {
    expect(nextSlug({ title: "Шинэ гарчиг", currentSlug: "khuuchin", publishedAt: null, taken: [] }))
      .toBe("shine-garchig");
  });
  it("нийтэлсний дараа гарчиг засахад slug хөдлөхгүй", () => {
    expect(nextSlug({ title: "Шинэ гарчиг", currentSlug: "khuuchin", publishedAt: new Date("2027-01-02"), taken: [] }))
      .toBe("khuuchin");
  });
  it("давхардлыг tenant дотор шийднэ", () => {
    expect(nextSlug({ title: "Төсөв", currentSlug: null, publishedAt: null, taken: ["tosov"] }))
      .toBe("tosov-2");
  });
});

describe("changeSlug", () => {
  it("гараар сольход хуучин хаягийг redirect-д өгнө", () => {
    expect(changeSlug({ currentSlug: "tosov", newSlug: "Төсвийн мэдээ", taken: [] }))
      .toEqual({ slug: "tosviin-medee", redirectFrom: "tosov" });
  });
  it("өөрчлөгдөөгүй бол redirect гаргахгүй", () => {
    expect(changeSlug({ currentSlug: "tosov", newSlug: "tosov", taken: ["tosov"] }))
      .toEqual({ slug: "tosov", redirectFrom: null });
  });
});
