import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { postBySlug } from "../../../../lib/posts";
import { storyMedia } from "../../../../lib/story-media";
import { metaDescription, absoluteUrl } from "../../../../lib/seo";
import { mnNumericDate } from "../../../../lib/format";

/**
 * `/story/<slug>` — сторины бие даасан хаяг.
 *
 * Стори нь нүүрэн дээр давхарга болж нээгддэг тул өөрийн хаяггүй байв:
 * хуваалцах, мессежээр илгээх, хайлтаар олох боломжгүй. Энэ хуудас нь
 * яг тэр харагдацыг СЕРВЕРЭЭС зурна — JS ачаалагдаагүй байхад ч бүтэн.
 *
 * Хугацаа нь дууссан стори ч ЭНД үлдэнэ: хуваалцсан холбоос хоёр хоногийн
 * дараа 404 болох нь уншигчийн хувьд эвдэрсэн сайт. Нүүрний зурвасаас л
 * хасагдана.
 */
export const revalidate = 300;

type Props = { params: { slug: string } };

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await postBySlug(params.slug);
  if (!post) return { title: "Стори олдсонгүй" };

  return {
    title: post.title,
    description: metaDescription(post.lead, post.body),
    alternates: { canonical: absoluteUrl(`/story/${post.slug}`, SITE) },
    openGraph: { type: "article", title: post.title, url: absoluteUrl(`/story/${post.slug}`, SITE) },
  };
}

export default async function StoryPage({ params }: Props) {
  const post = await postBySlug(params.slug);
  if (!post || !post.story) notFound();

  const media = storyMedia(post);

  return (
    <div className="mx-auto flex max-w-[460px] flex-col px-4 py-8">
      <div className="svb relative">
        <div className="svm">
          {media.video ? (
            <video src={media.src} autoPlay muted loop playsInline controls={false} />
          ) : (
            <img src={media.src} alt="" />
          )}
        </div>

        <div className="svt">
          <span className="svc">
            {post.featured ? "Онцлох · " : ""}
            {post.categoryName}
          </span>
          <h1 id="svT">{post.title}</h1>
          <p id="svL">{post.lead ?? ""}</p>
          <Link className="svgo" href={`/news/${post.slug}`}>
            Мэдээг унших →
          </Link>
        </div>
      </div>

      <p className="mt-3 text-center font-head text-[12.5px] text-muted">
        {mnNumericDate(post.date)} · Parliament News
      </p>
    </div>
  );
}
