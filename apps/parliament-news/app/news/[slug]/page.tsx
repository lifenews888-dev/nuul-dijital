import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { postBySlug, postIdByRedirect, type PostFull } from "../../../lib/posts";
import { resolveSlugTarget } from "../../../lib/article";
import { mnDate, readMinutes } from "../../../lib/format";
import { metaDescription, absoluteUrl } from "../../../lib/seo";
import { ArticleBody } from "../../../components/article-body";
import { PostCover } from "../../../components/post-cover";
import { PostImage } from "../../../components/post-image";

export const revalidate = 300;

type Params = { params: { slug: string } };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

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

export default async function ArticlePage({ params }: Params) {
  const direct = await postBySlug(params.slug);
  const found = direct ?? (await postIdByRedirect(params.slug));
  const target = resolveSlugTarget(params.slug, found);

  if (target.kind === "notFound") notFound();
  if (target.kind === "redirect") permanentRedirect(target.to);

  // target.kind === "render" тул direct заавал байна
  const post = direct as PostFull;
  const hero = post.media[0];

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: newsArticleJsonLd(post) }}
      />

      {post.kicker ? (
        <p className="font-head text-xs font-bold uppercase tracking-widest text-red">
          {post.kicker}
        </p>
      ) : null}

      <h1 className="mt-2 font-head text-4xl font-extrabold leading-tight tracking-tight">
        {post.title}
      </h1>

      {post.lead ? (
        <p className="mt-4 font-title text-xl leading-snug text-muted">{post.lead}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-rule/20 py-3 font-head text-sm text-muted">
        {post.categorySlug ? (
          <Link href={`/c/${post.categorySlug}`} className="font-semibold text-cob">
            {post.categoryName}
          </Link>
        ) : (
          <span>{post.categoryName}</span>
        )}
        <time dateTime={post.publishedAt.toISOString()}>{mnDate(post.date)}</time>
        {post.reporter ? <span>{post.reporter}</span> : null}
        <span>{readMinutes(post.body)} мин унших</span>
      </div>

      <figure className="mt-6">
        {hero ? (
          <PostImage
            src={hero.url}
            alt={hero.caption ?? post.title}
            variant="hero"
            priority
            className="h-auto w-full"
          />
        ) : (
          <PostCover post={post} className="mx-auto max-w-sm" />
        )}
        {hero?.caption ? (
          <figcaption className="mt-2 text-sm text-muted">{hero.caption}</figcaption>
        ) : null}
      </figure>

      <ArticleBody body={post.body} />

      {post.sources.length > 0 ? (
        <section className="mt-10 border-t border-rule/20 pt-4">
          <h2 className="font-head text-xs font-bold uppercase tracking-widest text-muted">
            Эх сурвалж
          </h2>
          <ul className="mt-2 space-y-1 text-sm">
            {post.sources.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {post.tags.length > 0 ? (
        <nav aria-label="Шошго" className="mt-8 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/tag/${encodeURIComponent(tag)}`}
              className="rounded-sm bg-sheet px-2 py-1 font-head text-xs font-semibold hover:text-cob"
            >
              #{tag}
            </Link>
          ))}
        </nav>
      ) : null}
    </article>
  );
}
