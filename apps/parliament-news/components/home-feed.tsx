import { mnAgo, mnDate, ubToday } from "../lib/format";
import { imageOrCover } from "../lib/images";
import { coverUrl } from "../lib/cover-input";
import { calendarUrl } from "../lib/calendar";
import { Icon } from "./icon";
import type { HomeData } from "../lib/home-data";
import type { PostListItem } from "../lib/posts";

/** Artifact-ийн `ST` — хуулийн төслийн таван шат */
const BILL_STAGES = [
  "Өргөн мэдүүлсэн",
  "Байнгын хороо",
  "Анхны хэлэлцүүлэг",
  "Эцсийн хэлэлцүүлэг",
  "Баталсан",
];

/** Онцлохын торонд хэдэн карт (эхнийх нь хоёр мөр эзэлнэ) */
const FEATURE_CARDS = 5;

function thumbSrc(post: PostListItem): string {
  const picked = imageOrCover(post.imageUrl);
  return picked.useImage ? picked.src : coverUrl(post.slug);
}

/**
 * Картын мета мөр.
 *
 * Artifact-д уншихад шаардах хугацаа ба сэтгэгдлийн тоо ч байдаг. Эхнийх нь
 * нийтлэлийн БИЕТ шаардана — жагсаалтын query нь 12 мэдээний биетийг
 * зориуд татдаггүй. Хоёр дахь нь сэтгэгдлийн систем (3-р шат) хүртэл бүгд
 * «0» гарна. Хоёулаа тэр үедээ нэмэгдэнэ; одоогоор сурвалжлагч харагдана.
 */
function Meta({ post }: { post: PostListItem }) {
  return (
    <span className="fmeta">
      <span>
        <Icon name="clock" />
        {mnAgo(post.publishedAt)}
      </span>
      <span>
        <Icon name="read" />
        {post.reporter ?? "Редакц"}
      </span>
    </span>
  );
}

/** Өнөөдөр парламентад — artifact-ийн `renderToday()` */
function Today({ live, agenda }: Pick<HomeData, "live" | "agenda">) {
  const today = ubToday();
  return (
    <section className="today" id="today" aria-label="Өнөөдөр парламентад">
      <div>
        <h2>Өнөөдөр парламентад</h2>
        <div className="td">
          {mnDate(today)}
          {live ? ` · ${live.sessionStatus}` : null}
        </div>
      </div>

      {live?.liveOn && live.liveUrl ? (
        <a className="tst on" href={live.liveUrl} target="_blank" rel="noopener">
          ШУУД үзэх
        </a>
      ) : (
        <span className="tst">Шууд дамжуулалт алга</span>
      )}

      <ol>
        {agenda.length > 0 ? (
          agenda.map((row, i) => (
            <li key={`${row.time}-${i}`}>
              <time>{row.time}</time>
              <span>{row.text}</span>
              <a
                className="rmd"
                href={calendarUrl(row.time, row.text, today)}
                target="_blank"
                rel="noopener"
                aria-label={`Календарьт сануулах: ${row.text}`}
              >
                <Icon name="bell" /> Сануулах
              </a>
            </li>
          ))
        ) : (
          <li>
            <time>—</time>
            <span>Өнөөдөр хуралдаан товлогдоогүй</span>
          </li>
        )}
      </ol>
    </section>
  );
}

/**
 * Нүүрний мэдээний урсгал — artifact-ийн `main.feed` (index.html:621).
 *
 * `<main>` БИШ, `<div>`: layout нь аль хэдийн `<main id="main">`-тэй бөгөөд
 * нэг хуудсанд хоёр `<main>` байж болохгүй. `.feed` нь ангиллын сонгогч
 * тул загвар нь хэвээр.
 *
 * Artifact-д карт бүр `<button>` бөгөөд JS нь дэлгэрэнгүйг нээдэг. Энд
 * ЖИНХЭНЭ холбоос: хайлтын робот, шинэ таб, JS-гүй хөтөч бүгд ажиллана.
 * `.fc`, `.fi` нь ангиллын сонгогч тул загвар хэвээр үлдэнэ.
 *
 * Ангиллын сонгогч (`#fCat`) ч холбоос — artifact-д client талын шүүлт,
 * энд `/c/<slug>` хуудас. Тэр хуудас нь хуудаслалттай тул artifact-ийн
 * «Цааш үзэх» товчны үүргийг мөн гүйцэтгэнэ.
 */
export function HomeFeed({ data }: { data: HomeData }) {
  const { latest, featured, live, agenda, bills } = data;

  // Artifact-ийн `feat`: онцлохууд түрүүлж, дутвал шинэ мэдээгээр гүйцээнэ
  const cards = [
    ...featured,
    ...latest.filter((p) => !featured.some((f) => f.slug === p.slug)),
  ].slice(0, FEATURE_CARDS);

  // Ангиллууд нь ЖАГСААЛТААС гарна (artifact-ийн `new Set(by.map(n=>n.c))`)
  const categories = [
    ...new Map(
      latest
        .filter((p) => p.categorySlug)
        .map((p) => [p.categorySlug as string, p.categoryName]),
    ).entries(),
  ];

  return (
    <div className="feed" id="feed">
      <div className="fw">
        <Today live={live} agenda={agenda} />

        {cards.length > 0 ? (
          <section className="fsec">
            <h2 className="fh">
              <i />
              Онцлох мэдээ
            </h2>
            <div className="fgrid" id="fFeat">
              {cards.map((post) => (
                <a className="fc" key={post.slug} href={`/news/${post.slug}`}>
                  <span className="im">
                    <img src={thumbSrc(post)} alt="" loading="lazy" decoding="async" />
                    {post.featured ? (
                      <span className="bdg">
                        <Icon name="star" /> ОНЦЛОХ
                      </span>
                    ) : null}
                  </span>
                  <span className="tx">
                    <span className="kc">{post.categoryName}</span>
                    <b>{post.title}</b>
                    <p>{post.lead ?? ""}</p>
                    <Meta post={post} />
                  </span>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        <div className="fcols">
          <div className="fmain">
            <h2 className="fh">
              <i />
              Шинэ мэдээ
            </h2>

            {categories.length > 0 ? (
              <nav className="fcat" id="fCat" aria-label="Ангилал">
                <a href="/" aria-current="page">
                  Бүгд
                </a>
                {categories.map(([slug, name]) => (
                  <a key={slug} href={`/c/${slug}`}>
                    {name}
                  </a>
                ))}
              </nav>
            ) : null}

            <div id="fList">
              {latest.map((post) => (
                <a className="fi" key={post.slug} href={`/news/${post.slug}`}>
                  <span className="tx">
                    <span className="kc">{post.categoryName}</span>
                    <b>{post.title}</b>
                    <p>{post.lead ?? ""}</p>
                    <Meta post={post} />
                  </span>
                  <span className="im">
                    <img src={thumbSrc(post)} alt="" loading="lazy" decoding="async" />
                  </span>
                </a>
              ))}
            </div>
          </div>

          <aside className="fside">
            <h2 className="fh sm">
              <i />
              Хуулийн төслийн явц
            </h2>
            <div id="fBills">
              {bills.length > 0 ? (
                bills.map((bill) => (
                  <a className="fb2" key={bill.slug} href={`/news/${bill.slug}`}>
                    <b>{bill.title}</b>
                    <span className="bst" aria-hidden="true">
                      {BILL_STAGES.map((_, j) => (
                        <i
                          key={j}
                          className={j < bill.stage ? "on" : j === bill.stage ? "cur" : ""}
                        />
                      ))}
                    </span>
                    <small>{BILL_STAGES[bill.stage]}</small>
                  </a>
                ))
              ) : (
                <p className="cmo">Одоогоор мэдээлэл алга.</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
