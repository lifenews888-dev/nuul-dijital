import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://nuul.digital";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`,            lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE_URL}/services`,    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE_URL}/blog`,        lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${SITE_URL}/about`,       lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/contact`,     lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/auth/signin`, lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${SITE_URL}/auth/signup`, lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
  ];

  let blogEntries: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blogPost.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true, publishedAt: true },
      orderBy: { publishedAt: "desc" },
    });
    blogEntries = posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: p.updatedAt ?? p.publishedAt ?? new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB унаснаас гарах статик sitemap-г үргэлжлүүлэн буцаа
  }

  return [...staticEntries, ...blogEntries];
}
