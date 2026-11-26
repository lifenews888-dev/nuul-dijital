import { describe, it, expect } from "vitest";
import { rssXml } from "./feed";

const items = [
  {
    slug: "tosov",
    title: 'АН & МАН "хоёр" <b>',
    lead: "Товч & тайлбар",
    publishedAt: new Date("2026-11-26T10:00:00Z"),
  },
];

describe("rssXml", () => {
  const xml = rssXml({ site: "https://parlamentnews.mn", title: "Парламентын мэдээ", items });

  it("RSS 2.0 бүрхүүл", () => {
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('<rss version="2.0"');
    expect(xml.trimEnd().endsWith("</rss>")).toBe(true);
  });

  it('гарчгийн &, <, " -г escape хийнэ — XML хугарахгүй', () => {
    expect(xml).toContain("АН &amp; МАН &quot;хоёр&quot; &lt;b&gt;");
    expect(xml).not.toContain("<b>");
  });

  it("& нь давхар escape болохгүй", () => {
    expect(xml).not.toContain("&amp;amp;");
  });

  it("link нь бүтэн хаяг", () => {
    expect(xml).toContain("<link>https://parlamentnews.mn/news/tosov</link>");
  });

  it("pubDate нь RFC 822", () => {
    expect(xml).toContain("<pubDate>Thu, 26 Nov 2026 10:00:00 GMT</pubDate>");
  });

  it("guid нь тогтвортой, бүтэн хаяг", () => {
    expect(xml).toContain('<guid isPermaLink="true">https://parlamentnews.mn/news/tosov</guid>');
  });

  it("мэдээ байхгүй бол ч хүчинтэй XML", () => {
    const empty = rssXml({ site: "https://x.mn", title: "T", items: [] });
    expect(empty).toContain("<channel>");
    expect(empty).not.toContain("<item>");
    expect(empty.trimEnd().endsWith("</rss>")).toBe(true);
  });

  it("сувгийн гарчиг ба хаягийг escape хийнэ", () => {
    const x = rssXml({ site: "https://x.mn", title: "A & B", items: [] });
    expect(x).toContain("<title>A &amp; B</title>");
  });

  it("lead байхгүй мэдээнд description хоосон байж болно", () => {
    const x = rssXml({
      site: "https://x.mn",
      title: "T",
      items: [{ slug: "a", title: "Гарчиг", lead: null, publishedAt: new Date(0) }],
    });
    expect(x).toContain("<description></description>");
  });

  it("base-ийн төгсгөлийн зураас давхардуулахгүй", () => {
    const x = rssXml({ site: "https://x.mn/", title: "T", items });
    expect(x).toContain("<link>https://x.mn/news/tosov</link>");
  });
});
