import type { Metadata } from "next";
import { countPosts, postsByTag } from "../../../../lib/posts";
import { pageParams } from "../../../../lib/paging";
import { PostCard } from "../../../../components/post-card";
import { Pager } from "../../../../components/pager";

export const revalidate = 300;

const PER_PAGE = 12;

type Props = {
  params: { tag: string };
  searchParams: { page?: string | string[] };
};

/** Таг нь кирилл байж болно — хаягт percent-encoded ирнэ. */
function decode(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    // Буруу кодчилсон хаяг нь 500 биш, түүхийгээрээ хайгдана
    return raw;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decode(params.tag);
  return {
    title: `#${tag}`,
    description: `"${tag}" шошготой мэдээ.`,
    alternates: { canonical: `/tag/${encodeURIComponent(tag)}` },
  };
}

export default async function TagPage({ params, searchParams }: Props) {
  const tag = decode(params.tag);

  const total = await countPosts({ tag });
  const { page, skip, take, pages } = pageParams(searchParams.page, PER_PAGE, total);
  const posts = await postsByTag(tag, { take, skip });

  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <h1 className="font-head text-3xl font-extrabold tracking-tight">#{tag}</h1>
      <p className="mt-1 font-head text-sm text-muted">{total} мэдээ</p>

      {/* Таг нь чөлөөт текст: байхгүй нь алдаа биш, 404 буцаахгүй */}
      {posts.length === 0 ? (
        <p className="mt-10 text-muted">Энэ шошгоор мэдээ алга.</p>
      ) : (
        <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      <Pager page={page} pages={pages} basePath={`/tag/${encodeURIComponent(tag)}`} />
    </div>
  );
}
