import { allPublishedForFeed } from "../../lib/posts";
import { getSiteSetting } from "../../lib/settings";
import { rssXml } from "../../lib/feed";

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
const MAX_ITEMS = 50;

export async function GET() {
  // Редакц RSS-ийг хаах боломжтой (tenant тохиргоо)
  const feed = await getSiteSetting("feed");
  if (!feed.rss) {
    return new Response("RSS идэвхгүй", { status: 404 });
  }

  const posts = await allPublishedForFeed(MAX_ITEMS);

  const xml = rssXml({
    site: SITE,
    title: "Парламентын мэдээ",
    items: posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      lead: p.lead,
      publishedAt: p.publishedAt,
    })),
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
