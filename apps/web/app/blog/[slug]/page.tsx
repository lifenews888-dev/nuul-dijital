import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Calendar,
  Eye,
  ArrowLeft,
  Tag,
  BookOpen,
} from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { ShareButton } from "./ShareButton";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
    select: {
      title: true,
      excerpt: true,
      coverImage: true,
      publishedAt: true,
      author: { select: { name: true } },
      tags: true,
    },
  });

  if (!post) return { title: "Not Found" };

  const url = `https://nuul.digital/blog/${params.slug}`;
  const description = post.excerpt ?? `${post.title} | Nuul.digital`;
  const images = post.coverImage
    ? [{ url: post.coverImage, width: 1200, height: 630, alt: post.title }]
    : undefined;

  return {
    title: `${post.title} | Nuul.digital Блог`,
    description,
    alternates: { canonical: url },
    keywords: post.tags,
    authors: post.author?.name ? [{ name: post.author.name }] : undefined,
    openGraph: {
      type: "article",
      url,
      siteName: "Nuul.digital",
      title: post.title,
      description,
      images,
      locale: "mn_MN",
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug },
    include: {
      author: { select: { id: true, name: true, image: true } },
      category: { select: { id: true, name: true, slug: true, color: true } },
    },
  });

  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  // Increment view count
  await prisma.blogPost
    .update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => {});

  // Related posts
  const related = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      id: { not: post.id },
      ...(post.categoryId ? { categoryId: post.categoryId } : {}),
    },
    include: {
      author: { select: { name: true } },
      category: { select: { name: true, color: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const postUrl = `https://nuul.digital/blog/${post.slug}`;

  return (
    <div className="min-h-screen bg-[#030310] text-white">
      <PublicNav />

      {/* ── Article ── */}
      <article className="mx-auto max-w-3xl px-6 pb-20 pt-[110px]">
        {/* Back */}
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] text-white/40 transition-all hover:bg-white/[0.04] hover:text-white/60"
        >
          <ArrowLeft size={14} />
          Блог руу буцах
        </Link>

        {/* Cover image */}
        {post.coverImage && (
          <div className="mb-8 overflow-hidden rounded-2xl">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full object-cover"
              style={{ maxHeight: 440 }}
            />
          </div>
        )}

        {/* Meta */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {post.category && (
            <span
              className="rounded-full px-3 py-1 text-[12px] font-medium"
              style={{
                backgroundColor: `${post.category.color ?? "#7B6FFF"}18`,
                color: post.category.color ?? "#9F98FF",
              }}
            >
              {post.category.name}
            </span>
          )}
          <span className="flex items-center gap-1 text-[12px] text-white/35">
            <Calendar size={12} />
            {post.publishedAt ? formatDate(post.publishedAt) : ""}
          </span>
          <span className="flex items-center gap-1 text-[12px] text-white/35">
            <Eye size={12} />
            {post.viewCount} уншсан
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-4 font-syne text-[clamp(28px,4vw,42px)] font-bold leading-tight tracking-[-1px]">
          {post.title}
        </h1>

        {/* Author */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7B6FFF20] text-[13px] font-bold text-[#9F98FF]">
            {post.author?.name?.charAt(0) ?? "N"}
          </div>
          <div>
            <div className="text-[13px] font-medium">{post.author?.name}</div>
          </div>
        </div>

        {/* Video embed */}
        {post.videoUrl && (
          <div className="mb-8 aspect-video overflow-hidden rounded-2xl border border-white/[0.08]">
            <iframe
              src={post.videoUrl.replace("watch?v=", "embed/")}
              className="h-full w-full"
              allowFullScreen
              title={post.title}
            />
          </div>
        )}

        {/* Content */}
        <div
          className="prose prose-invert prose-lg max-w-none prose-headings:font-syne prose-headings:tracking-tight prose-h2:text-xl prose-h3:text-lg prose-p:text-white/70 prose-p:leading-relaxed prose-a:text-[#7B6FFF] prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-li:text-white/70 prose-code:text-[#00E5B8] prose-pre:bg-white/[0.04] prose-pre:border prose-pre:border-white/[0.06] prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-6">
            <Tag size={14} className="text-white/30" />
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="rounded-full bg-white/[0.04] px-3 py-1 text-[12px] text-white/50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Share */}
        <div className="mt-6 flex items-center gap-3 border-t border-white/[0.06] pt-6">
          <span className="text-[13px] text-white/40">Хуваалцах:</span>
          <ShareButton url={postUrl} />
        </div>
      </article>

      {/* ── Related Posts ── */}
      {related.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <h2 className="mb-6 font-syne text-xl font-bold">Холбоотой нийтлэлүүд</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} href={`/blog/${r.slug}`}>
                <div className="group overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-[#7B6FFF30]">
                  {r.coverImage ? (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={r.coverImage}
                        alt={r.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-[#7B6FFF10] to-[#00E5B808]">
                      <BookOpen size={28} className="text-white/10" />
                    </div>
                  )}
                  <div className="p-4">
                    {r.category && (
                      <span
                        className="mb-1.5 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${r.category.color ?? "#7B6FFF"}18`,
                          color: r.category.color ?? "#9F98FF",
                        }}
                      >
                        {r.category.name}
                      </span>
                    )}
                    <h3 className="line-clamp-2 font-syne text-[14px] font-bold leading-snug">
                      {r.title}
                    </h3>
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-white/30">
                      <span>{r.author?.name}</span>
                      <span>
                        {r.publishedAt ? formatDate(r.publishedAt) : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <PublicFooter />
    </div>
  );
}
