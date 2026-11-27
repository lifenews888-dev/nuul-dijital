import { tickerItems, type TickerAd } from "../../lib/ticker";
import { TickerInfo } from "../info";
import type { PostListItem } from "../../lib/posts";
import type { SiteInfo } from "../../lib/info-data";

/**
 * Толгойн доорх гүйдэг мөр — artifact-ийн `.tick` (index.html:586).
 *
 * Мэдээний гарчгууд нь ХУУЧНААС шинэ рүү гүйнэ, зар нь гурав тутамд нэг.
 * Жагсаалтыг ХОЁР удаа зурна: CSS-ийн `@keyframes tick` нь -50% хүртэл
 * гүйлгэдэг тул хоёр дахь хуулбар нь оёдлыг нуух зай.
 *
 * Мэдээ огт байхгүй бол (`items` хоосон) юу ч зурахгүй: зар ганцаараа
 * гүйх нь мэдээний мөр биш, самбар болно.
 */
export function Ticker({
  posts,
  ads,
  on,
  info,
}: {
  posts: PostListItem[];
  ads: TickerAd[];
  on: boolean;
  info: SiteInfo;
}) {
  if (!on) return null;
  const items = tickerItems([...posts].reverse().map((p) => p.title), ads);
  if (items.length === 0) return null;

  /**
   * `echo` нь хоёр дахь хуулбар: дэлгэц уншигчид мэдээг хоёр удаа уншихгүй.
   * Бүрхүүл элемент ХЭРЭГЛЭХГҮЙ — `.tr span::before { content:"■" }` нь
   * `display:contents` бүрхүүлд ч тэмдэг нэмж, нэмэлт цэг гарна.
   */
  const run = (copy: number) => {
    const echo = copy > 0;
    return items.map((item, i) => {
      const key = `${copy}-${i}`;
      if (item.kind === "news") {
        return (
          <span key={key} aria-hidden={echo || undefined}>
            {item.text}
          </span>
        );
      }
      if (item.url) {
        return (
          <a
            className="tad"
            key={key}
            href={item.url}
            target="_blank"
            rel="noopener sponsored"
            aria-hidden={echo || undefined}
            tabIndex={echo ? -1 : undefined}
          >
            {item.text}
          </a>
        );
      }
      // Холбоосгүй зар: гадна `span.tad` нь жагсаалтын ■ тэмдгийг хаана
      return (
        <span className="tad" key={key} aria-hidden={echo || undefined}>
          <a className="tad">{item.text}</a>
        </span>
      );
    });
  };

  return (
    <div className="tick" aria-label="Шууд мэдээ">
      <b className="lbl">ШУУД</b>
      <div className="tw">
        <div className="tr" id="tr">
          {run(0)}
          {run(1)}
        </div>
      </div>
      {/* Цаг агаар ба ханш. `.tinfo:empty` нь өөрөө нуугдана. */}
      <div className="tinfo" id="tinfo">
        <TickerInfo info={info} />
      </div>
    </div>
  );
}
