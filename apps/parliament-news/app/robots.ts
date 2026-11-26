import type { MetadataRoute } from "next";
import { absoluteUrl } from "../lib/seo";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Редакцын хэсэг ба API индекслэгдэх зүйл биш
      disallow: ["/studio", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml", SITE),
  };
}
