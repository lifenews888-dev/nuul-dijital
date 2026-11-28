import type { MetadataRoute } from "next";
import { allCategories, allPublishedForFeed } from "../lib/posts";
import { allBills } from "../lib/bill-page";
import { absoluteUrl } from "../lib/seo";

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
/** Нэг sitemap-ийн хязгаар нь 50 000; хүрэхэд индекс болгож хуваана */
const MAX_POSTS = 5000;

/**
 * Нийтлэгдсэн мэдээ л орно: жагсаалт нь `lib/posts.ts`-ийн нийтийн хаалгаар
 * дамждаг тул ноорог, цаг товлосон мэдээ энд орох боломжгүй.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, posts, bills] = await Promise.all([
    allCategories(),
    allPublishedForFeed(MAX_POSTS),
    allBills(),
  ]);

  return [
    {
      url: absoluteUrl("/", SITE),
      lastModified: posts[0]?.updatedAt ?? new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    ...categories.map((c) => ({
      url: absoluteUrl(`/c/${c.slug}`, SITE),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    /*
     * `/live` нь контент биш ч индекслэгдэх ёстой: «парламент шууд» гэж
     * хайсан хүн бидэн дээр ирэх цорын ганц зам.
     */
    {
      url: absoluteUrl("/live", SITE),
      changeFrequency: "hourly" as const,
      priority: 0.7,
    },
    {
      url: absoluteUrl("/ads", SITE),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    ...posts.map((p) => ({
      url: absoluteUrl(`/news/${p.slug}`, SITE),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    /*
     * Стори нь нийтлэл рүү чиглүүлдэг хуудас тул priority нь бага; гэхдээ
     * хуваалцсан холбоос индекслэгдээгүй бол хайлтаас олдохгүй.
     */
    ...posts
      .filter((p) => p.story)
      .map((p) => ({
        url: absoluteUrl(`/story/${p.slug}`, SITE),
        lastModified: p.updatedAt,
        changeFrequency: "daily" as const,
        priority: 0.4,
      })),
    ...bills.map((b) => ({
      url: absoluteUrl(`/bill/${b.id}`, SITE),
      lastModified: b.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
