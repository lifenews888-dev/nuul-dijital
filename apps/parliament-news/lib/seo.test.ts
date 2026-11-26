import { describe, it, expect } from "vitest";
import { xmlEscape, absoluteUrl, metaDescription, META_MAX } from "./seo";

describe("xmlEscape", () => {
  it("XML-ийн таван тэмдэгт", () => {
    expect(xmlEscape(`АН & МАН <b> "хоёр" 'гурав'`)).toBe(
      "АН &amp; МАН &lt;b&gt; &quot;хоёр&quot; &apos;гурав&apos;",
    );
  });
  it("кирилл хөндөгдөхгүй", () => {
    expect(xmlEscape("Чуулган")).toBe("Чуулган");
  });
  it("& нь давхар escape болохгүй", () => {
    expect(xmlEscape("a & b")).toBe("a &amp; b");
    expect(xmlEscape("a < b & c")).toBe("a &lt; b &amp; c");
    expect(xmlEscape("<>")).toBe("&lt;&gt;");
  });
  it("аль хэдийн escape хийсэн текстийг дахин escape хийнэ (idempotent БИШ)", () => {
    // Зориуд: оролт нь түүхий текст гэж үзнэ. Хоёр удаа дуудвал буруу —
    // дуудагч нэг л удаа дуудна.
    expect(xmlEscape("&amp;")).toBe("&amp;amp;");
  });
  it("хоосон мөр", () => {
    expect(xmlEscape("")).toBe("");
  });
});

describe("absoluteUrl", () => {
  it("base-тэй залгана", () => {
    expect(absoluteUrl("/news/tosov", "https://parlamentnews.mn")).toBe(
      "https://parlamentnews.mn/news/tosov",
    );
  });
  it("base-ийн төгсгөлийн зураас давхардуулахгүй", () => {
    expect(absoluteUrl("/news/tosov", "https://parlamentnews.mn/")).toBe(
      "https://parlamentnews.mn/news/tosov",
    );
  });
  it("эхний зураасгүй замд зураас нэмнэ", () => {
    expect(absoluteUrl("news/tosov", "https://parlamentnews.mn")).toBe(
      "https://parlamentnews.mn/news/tosov",
    );
  });
  it("нүүр хуудас", () => {
    expect(absoluteUrl("/", "https://parlamentnews.mn")).toBe("https://parlamentnews.mn/");
  });

  // Vercel Blob-ийн зураг ҮРГЭЛЖ бүтэн хаягтай ирнэ. Нөхцөлгүй залгавал
  // JSON-LD-д .../https://... болж, Google зургийг хаяна; OG зураг татаж чадахгүй.
  it("аль хэдийн бүтэн хаягийг хөндөхгүй", () => {
    expect(
      absoluteUrl("https://abc.public.blob.vercel-storage.com/x.jpg", "https://parlamentnews.mn"),
    ).toBe("https://abc.public.blob.vercel-storage.com/x.jpg");
    expect(absoluteUrl("http://ex.mn/a.jpg", "https://parlamentnews.mn")).toBe("http://ex.mn/a.jpg");
    expect(absoluteUrl("HTTPS://ex.mn/a.jpg", "https://parlamentnews.mn")).toBe("HTTPS://ex.mn/a.jpg");
  });
});

describe("metaDescription", () => {
  it("lead байвал түүнээс", () => {
    expect(metaDescription("Товч тайлбар", "Биет")).toBe("Товч тайлбар");
  });
  it("lead байхгүй бол биетээс 155 тэмдэгт", () => {
    const body = "а".repeat(400);
    expect(metaDescription(null, body).length).toBeLessThanOrEqual(META_MAX + 1);
  });
  it("хоёулаа хоосон бол хоосон", () => {
    expect(metaDescription(null, null)).toBe("");
  });
  it("хэт урт lead-ийг ч тасална", () => {
    const out = metaDescription("а".repeat(400), null);
    expect(out.length).toBeLessThanOrEqual(META_MAX + 1);
  });
  it("зөвхөн зайтай lead нь биет руу эргэнэ", () => {
    expect(metaDescription("   ", "Биетийн текст")).toBe("Биетийн текст");
  });
  it("мөр дамжсан биетийг нэг мөр болгоно", () => {
    expect(metaDescription(null, "Нэг мөр\n\nХоёр мөр")).toBe("Нэг мөр Хоёр мөр");
  });
});
