import { describe, it, expect } from "vitest";
import { imageSizes, imageDims, safeImageSrc, imageOrCover } from "./images";
import { COVER_W, COVER_H } from "./cover";

describe("imageDims", () => {
  it("hero нь 16:9", () => {
    const d = imageDims("hero");
    expect(d.width / d.height).toBeCloseTo(16 / 9, 2);
  });
  it("card нь 3:2", () => {
    const d = imageDims("card");
    expect(d.width / d.height).toBeCloseTo(3 / 2, 2);
  });
  it("shelf нь хавтасны хэмжээтэй ЯГ адил — cover.ts-ээс ирнэ", () => {
    expect(imageDims("shelf")).toEqual({ width: COVER_W, height: COVER_H });
    expect(imageDims("shelf")).toEqual({ width: 474, height: 900 });
  });
});

describe("imageSizes", () => {
  it("hero нь мобайлд бүтэн, дэлгэцэд хязгаартай", () => {
    expect(imageSizes("hero")).toBe("(max-width: 768px) 100vw, 800px");
  });
  it("card нь мобайлд бүтэн, дэлгэцэд гуравны нэг", () => {
    expect(imageSizes("card")).toBe("(max-width: 768px) 100vw, 33vw");
  });
  it("хувилбар бүр өөр", () => {
    const all = (["hero", "card", "shelf"] as const).map(imageSizes);
    expect(new Set(all).size).toBe(3);
  });
});

describe("safeImageSrc", () => {
  it("дотоод зам нь зөвшөөрөгдөнө", () => {
    expect(safeImageSrc("/demo/palace.jpg")).toBe("/demo/palace.jpg");
  });
  it("зөвшөөрсөн host нь дамжина", () => {
    expect(safeImageSrc("https://abc.public.blob.vercel-storage.com/a.jpg")).toBe(
      "https://abc.public.blob.vercel-storage.com/a.jpg",
    );
  });
  it("зөвшөөрөөгүй host → null (эвдэрсэн зураг биш, хавтас зурагдана)", () => {
    expect(safeImageSrc("https://example.com/a.jpg")).toBeNull();
    expect(safeImageSrc("https://evil.public.blob.vercel-storage.com.attacker.mn/a.jpg"))
      .toBeNull();
  });
  it("javascript: ба data: → null", () => {
    expect(safeImageSrc("javascript:alert(1)")).toBeNull();
    expect(safeImageSrc("data:image/svg+xml,<svg onload=alert(1)>")).toBeNull();
  });
  it("http (шифрлэгдээгүй) → null", () => {
    expect(safeImageSrc("http://abc.public.blob.vercel-storage.com/a.jpg")).toBeNull();
  });
  it("хоосон, null, undefined, хэлбэр нь бус мөр → null", () => {
    for (const v of ["", "   ", null, undefined, "://", "http://"]) {
      expect(safeImageSrc(v)).toBeNull();
    }
  });
  it("протоколгүй // хаяг → null", () => {
    expect(safeImageSrc("//evil.com/a.jpg")).toBeNull();
  });
  it("зам руу буцах оролдлого → null", () => {
    expect(safeImageSrc("/../../etc/passwd")).toBeNull();
    expect(safeImageSrc("/demo/../../secret.jpg")).toBeNull();
  });
  it("зайг тайрна", () => {
    expect(safeImageSrc("  /demo/palace.jpg  ")).toBe("/demo/palace.jpg");
  });
});

/**
 * Хянагчийн олсон зүйл: дуудагчид мэдээнд зураг БАЙГАА эсэхээр салаалдаг
 * байсан, safeImageSrc АМЖИЛТТАЙ эсэхээр биш. Зөвшөөрөөгүй host-ын зураг нь
 * PostImage-ийг null болгодог тул нийтлэлд хоосон figure, картад хоосон саарал
 * хайрцаг үлдэж байв — хавтас руу эргэх ёстой байсан.
 */
describe("imageOrCover", () => {
  it("зөвшөөрөгдсөн зураг — зургийг хэрэглэнэ", () => {
    expect(imageOrCover("/demo/palace.jpg")).toEqual({
      useImage: true,
      src: "/demo/palace.jpg",
    });
    expect(imageOrCover("https://abc.public.blob.vercel-storage.com/a.jpg")).toEqual({
      useImage: true,
      src: "https://abc.public.blob.vercel-storage.com/a.jpg",
    });
  });

  it("зөвшөөрөөгүй host — хавтас руу эргэнэ, хоосон орон зай биш", () => {
    expect(imageOrCover("https://example.com/a.jpg")).toEqual({ useImage: false });
    expect(imageOrCover("javascript:alert(1)")).toEqual({ useImage: false });
    expect(imageOrCover("//evil.com/a.jpg")).toEqual({ useImage: false });
  });

  it("зураггүй мэдээ — хавтас", () => {
    expect(imageOrCover(null)).toEqual({ useImage: false });
    expect(imageOrCover(undefined)).toEqual({ useImage: false });
    expect(imageOrCover("   ")).toEqual({ useImage: false });
  });
});
