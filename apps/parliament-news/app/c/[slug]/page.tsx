import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryBySlug, countPosts, postsByCategory } from "../../../lib/posts";
import { pageParams } from "../../../lib/paging";
import { PostCard } from "../../../components/post-card";
import { Pager } from "../../../components/pager";

export const revalidate = 300;

const PER_PAGE = 12;

type Props = {
  params: { slug: string };
  searchParams: { page?: string | string[] };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await categoryBySlug(params.slug);
  if (!category) return { title: "Ангилал олдсонгүй" };
  return {
    title: category.name,
    description: `${category.name} ангиллын мэдээ.`,
    alternates: { canonical: `/c/${category.slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await categoryBySlug(params.slug);
  if (!category) notFound();

  const total = await countPosts({ categorySlug: params.slug });
  const { page, skip, take, pages } = pageParams(searchParams.page, PER_PAGE, total);
  const posts = await postsByCategory(params.slug, { take, skip });

  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <h1 className="font-head text-3xl font-extrabold tracking-tight">{category.name}</h1>
      <p className="mt-1 font-head text-sm text-muted">{total} мэдээ</p>

      {posts.length === 0 ? (
        <p className="mt-10 text-muted">Энэ ангилалд мэдээ хараахан алга.</p>
      ) : (
        <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      <Pager page={page} pages={pages} basePath={`/c/${category.slug}`} />
    </div>
  );
}
