import { tenantData, type TenantClient } from "./tenant-db";
import { queueableChannels, composeText } from "./social";
import { absoluteUrl } from "./seo";

/**
 * Нийтлэгдсэн мэдээг сошиал дараалалд оруулна.
 *
 * Илгээлтийг ЭНД хийхгүй: «Нийтлэх» товч нь Facebook-ийн хариу хүлээж
 * зогсох ёсгүй. Мөр үүсгээд шууд буцна; `/api/social/dispatch` түүнийг
 * хожим илгээнэ.
 *
 * Давхардахгүй: `@@unique([tenantId, postId, channel])` тул дахин
 * нийтлэхэд шинэ мөр үүсэхгүй. Нэг мэдээг хоёр удаа постлох нь
 * уншигчийн хувьд спам.
 */
export async function enqueueSocial(
  db: TenantClient,
  post: { id: string; slug: string; title: string; lead: string | null; channels: string[] },
  siteUrl: string,
): Promise<number> {
  const keys = queueableChannels(post.channels);
  if (keys.length === 0) return 0;

  const text = composeText({
    title: post.title,
    lead: post.lead,
    url: absoluteUrl(`/news/${post.slug}`, siteUrl),
  });

  const made = await db.socialPost.createMany({
    data: keys.map((channel) => tenantData({ postId: post.id, channel, text })),
    skipDuplicates: true,
  });

  return made.count;
}
