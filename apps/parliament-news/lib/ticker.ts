/**
 * Гүйдэг мөрийн элементүүд — цэвэр тооцоо.
 *
 * Artifact-ийн `buildTicker()` (index.html:847): мэдээний гарчгууд нь үндсэн
 * урсгал, зар нь ГУРАВ тутамд нэг ороод эргэлдэнэ. Зар ганцаараа гүйхгүй —
 * мэдээгүй бол мөр хоосон.
 */
export type TickerAd = { text: string; url: string | null };
export type TickerItem =
  | { kind: "news"; text: string }
  | { kind: "ad"; text: string; url: string | null };

/** Хэдэн мэдээ тутамд нэг зар */
const AD_EVERY = 3;

export function tickerItems(titles: string[], ads: TickerAd[]): TickerItem[] {
  const out: TickerItem[] = [];
  titles.forEach((text, k) => {
    out.push({ kind: "news", text });
    if (ads.length && k % AD_EVERY === AD_EVERY - 1) {
      const ad = ads[Math.floor(k / AD_EVERY) % ads.length];
      out.push({ kind: "ad", text: ad.text, url: ad.url });
    }
  });
  return out;
}
