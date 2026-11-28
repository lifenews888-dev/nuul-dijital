import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { postBySlug, postIdByRedirect, type PostFull } from "../../../../lib/posts";
import { articleView } from "../../../../lib/article-view";
import { resolveSlugTarget, paragraphs } from "../../../../lib/article";
import { mnNumericDate, readMinutes } from "../../../../lib/format";
import { runningHeader } from "../../../../lib/reading";
import { metaDescription, absoluteUrl } from "../../../../lib/seo";
import { safeImageSrc } from "../../../../lib/images";
import { coverUrl } from "../../../../lib/cover-input";
import { ReadingProgress } from "../../../../components/article/reading-progress";
import { ReaderTools, ShareButtons } from "../../../../components/article/reader-tools";
import { BillTrack } from "../../../../components/article/bill-track";
import { Gallery, type Slide } from "../../../../components/article/gallery";
import { NextNews } from "../../../../components/article/next-news";
import { Comments } from "../../../../components/article/comments";
import { RichBody } from "../../../../components/article/rich-body";

export const revalidate = 300;

type Params = { params: { slug: string } };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
const VIDEO = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await postBySlug(params.slug);
  if (!post) return { title: "Мэдээ олдсонгүй" };

  const url = absoluteUrl(`/news/${post.slug}`, SITE);
  const description = metaDescription(post.lead, post.body);

  return {
    title: post.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url,
      publishedTime: post.publishedAt.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      section: post.categoryName,
      tags: post.tags,
    },
  };
}

/** Google News, Discover-ийн rich result үүнээс хамаарна. */
function newsArticleJsonLd(post: PostFull): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: metaDescription(post.lead, post.body),
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    articleSection: post.categoryName,
    keywords: post.tags.join(", "),
    author: post.reporter
      ? [{ "@type": "Person", name: post.reporter }]
      : [{ "@type": "Organization", name: "Парламентын мэдээ" }],
    publisher: { "@type": "Organization", name: "Парламентын мэдээ" },
    mainEntityOfPage: absoluteUrl(`/news/${post.slug}`, SITE),
    ...(post.imageUrl ? { image: [absoluteUrl(post.imageUrl, SITE)] } : {}),
  };
  // `<` нь </script> болж таг хаахаас сэргийлнэ
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * Баруун хуудасны слайдууд. Зөвшөөрөгдөөгүй host-ын зураг хаягдана — хоосон
 * нүх үлдээхээс хавтас нь дээр.
 */
function slidesOf(post: PostFull): { slides: Slide[]; ratio: string } {
  const media: Slide[] = [];
  for (const m of post.media) {
    const src = safeImageSrc(m.url);
    if (src) media.push({ url: src, caption: m.caption, video: VIDEO.test(src), blur: true });
  }
  if (media.length > 0) return { slides: media, ratio: "wide" };
  return {
    slides: [{ url: coverUrl(post.slug), caption: null, video: false, blur: false }],
    ratio: "book",
  };
}

export default async function ArticlePage({ params }: Params) {
  const direct = await postBySlug(params.slug);
  const found = direct ?? (await postIdByRedirect(params.slug));
  const target = resolveSlugTarget(params.slug, found);

  if (target.kind === "notFound") notFound();
  if (target.kind === "redirect") permanentRedirect(target.to);

  // target.kind === "render" тул direct заавал байна
  const post = direct as PostFull;
  const view = await articleView(post);
  const url = absoluteUrl(`/news/${post.slug}`, SITE);
  const { slides, ratio } = slidesOf(post);
  /** Сонсох нь ЦЭВЭР текст сонсоно — тэмдэглэгээг уншуулах нь утгагүй. */
  const speech = [post.lead, ...paragraphs(post.body)].filter(Boolean).join(" ");

  return (
    <article className="artpage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: newsArticleJsonLd(post) }}
      />
      <ReadingProgress />

      <div className="spread">
        <div className="pg L">
          <div className="rh lbl">{runningHeader(post.categoryName)}</div>

          <div className="dl">
            <div className="m">
              <span className="lbl dcat">
                {post.categorySlug ? (
                  <Link href={`/c/${post.categorySlug}`}>{post.categoryName.toUpperCase()}</Link>
                ) : (
                  post.categoryName.toUpperCase()
                )}
              </span>
            </div>

            <div className="m">
              <span>
                <h1 className="dt1">{post.title}</h1>
              </span>
            </div>

            <div className="m">
              <span className="dmeta">
                {mnNumericDate(post.date)} / {post.categoryName} / {readMinutes(post.body)} мин
                унших
              </span>
            </div>

            <div className="m">
              <span className="tbar" role="toolbar" aria-label="Нийтлэлийн хэрэгсэл">
                <ReaderTools url={url} title={post.title} speech={speech} />
              </span>
            </div>

            {view.bill ? (
              <div className="m">
                <span>
                  <BillTrack bill={view.bill} />
                </span>
              </div>
            ) : null}

            {post.lead ? (
              <div className="m">
                <span>
                  <p className="dlede">{post.lead}</p>
                </span>
              </div>
            ) : null}

            {post.body ? (
              <div className="m">
                <span>
                  <RichBody body={post.body} />
                </span>
              </div>
            ) : null}

            {post.reporter ? (
              <div className="m">
                <span className="dcred">Сурвалжлагч {post.reporter} · Parliament News</span>
              </div>
            ) : null}

            {post.tags.length > 0 ? (
              <div className="m">
                <span className="dtags">
                  {post.tags.map((tag) => (
                    <Link key={tag} href={`/tag/${encodeURIComponent(tag)}`}>
                      #{tag}
                    </Link>
                  ))}
                </span>
              </div>
            ) : null}

            {post.sources.length > 0 ? (
              <div className="m">
                <span>
                  <div className="srch3">ЭХ СУРВАЛЖ БА ХОЛБООС</div>
                  <ul className="alk">
                    {post.sources.map((s) => (
                      <li key={s}>
                        {/^https?:\/\//.test(s) ? (
                          <a href={s} target="_blank" rel="noopener">
                            {s.replace(/^https?:\/\//, "").slice(0, 60)} ↗
                          </a>
                        ) : (
                          s
                        )}
                      </li>
                    ))}
                  </ul>
                </span>
              </div>
            ) : null}

            <div className="m">
              <span className="tbar end">
                <span className="tbl">Хуваалцах</span>
                <ShareButtons url={url} title={post.title} />
              </span>
            </div>

            <div className="m">
              <span className="nx">
                <NextNews next={view.next} related={view.related} />
              </span>
            </div>

            <div className="m">
              <span className="cm">
                <Comments comments={view.comments} />
              </span>
            </div>

            <div className="m">
              <span className="note">
                Parliament News бол хараат бус хэвлэл мэдээллийн байгууллага бөгөөд УИХ-ын албан
                ёсны сайт биш. Хуулийн албан ёсны эхийг{" "}
                <a href="https://legalinfo.mn" target="_blank" rel="noopener">
                  legalinfo.mn
                </a>
                -ээс үзнэ үү.
              </span>
            </div>
          </div>
        </div>

        <div className="pg R">
          <Gallery slides={slides} ratio={ratio} />
        </div>
      </div>
    </article>
  );
}
