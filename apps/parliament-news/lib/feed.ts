import { xmlEscape, absoluteUrl } from "./seo";

/**
 * RSS 2.0.
 *
 * Гар аргаар бүтээж байгаа нь зориуд: сан нэмэх шалтгаан байхгүй, харин
 * escape нь `lib/seo.ts`-ийн нэг дүрмээр явах нь чухал. Гарчигт `&` байхад
 * XML хугарах нь RSS-ийн хамгийн түгээмэл алдаа.
 */
export type FeedItem = {
  slug: string;
  title: string;
  lead: string | null;
  publishedAt: Date;
};

/** RFC 822 — RSS нь ISO биш, энэ хэлбэрийг шаарддаг */
function rfc822(d: Date): string {
  return d.toUTCString();
}

export function rssXml(input: {
  site: string;
  title: string;
  items: FeedItem[];
}): string {
  const self = absoluteUrl("/rss.xml", input.site);

  const items = input.items
    .map((item) => {
      const url = absoluteUrl(`/news/${item.slug}`, input.site);
      return [
        "    <item>",
        `      <title>${xmlEscape(item.title)}</title>`,
        `      <link>${xmlEscape(url)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
        `      <description>${xmlEscape(item.lead ?? "")}</description>`,
        `      <pubDate>${rfc822(item.publishedAt)}</pubDate>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xmlEscape(input.title)}</title>`,
    `    <link>${xmlEscape(absoluteUrl("/", input.site))}</link>`,
    `    <description>${xmlEscape(input.title)}</description>`,
    "    <language>mn</language>",
    `    <atom:link href="${xmlEscape(self)}" rel="self" type="application/rss+xml"/>`,
    items ? items : "",
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
