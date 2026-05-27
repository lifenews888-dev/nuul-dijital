"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc-client";
import {
  Eye,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  BookOpen,
} from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const categories = trpc.blog.getCategories.useQuery();
  const featured = trpc.blog.getFeaturedPosts.useQuery();
  const posts = trpc.blog.getPosts.useQuery({
    category,
    search: search || undefined,
    page,
    limit: 9,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  return (
    <div className="min-h-screen bg-[#030310] text-white">
      <PublicNav />

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center px-6 pb-8 pt-[130px] text-center">
        <div className="absolute -right-[200px] -top-[100px] h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,#7B6FFF15_0%,transparent_65%)]" />
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#7B6FFF30] bg-[#7B6FFF10] px-4 py-1.5 text-[11.5px] font-medium text-[#9F98FF]">
          <BookOpen size={13} />
          Блог & Мэдээлэл
        </div>
        <h1 className="mb-4 font-syne text-[clamp(36px,5vw,64px)] font-bold leading-tight tracking-[-2px]">
          Мэдээ &{" "}
          <span className="bg-gradient-to-r from-[#7B6FFF] to-[#00E5B8] bg-clip-text text-transparent">
            Нийтлэл
          </span>
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-white/50">
          Технологи, бизнес, дижитал шийдлүүдийн талаарх мэдээ, зөвлөгөө.
        </p>
      </section>

      {/* ── Search ── */}
      <div className="mx-auto mb-6 max-w-xl px-6">
        <form onSubmit={handleSearch} className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 pl-11 pr-4 text-[13px] text-white outline-none transition-all focus:border-[#7B6FFF40] focus:bg-white/[0.05]"
            placeholder="Нийтлэл хайх..."
          />
        </form>
      </div>

      {/* ── Featured Post ── */}
      {featured.data && featured.data.length > 0 && !search && !category && page === 1 && (
        <div className="mx-auto mb-10 max-w-6xl px-6">
          <Link href={`/blog/${featured.data[0].slug}`}>
            <div className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-[#7B6FFF30] hover:shadow-[0_0_40px_#7B6FFF10]">
              <div className="grid md:grid-cols-2">
                {featured.data[0].coverImage ? (
                  <div className="aspect-[16/9] overflow-hidden md:aspect-auto md:min-h-[300px]">
                    <img
                      src={featured.data[0].coverImage}
                      alt={featured.data[0].title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-[#7B6FFF15] to-[#00E5B810] md:aspect-auto md:min-h-[300px]">
                    <BookOpen size={48} className="text-white/10" />
                  </div>
                )}
                <div className="flex flex-col justify-center p-8">
                  <div className="mb-3 flex items-center gap-3">
                    {featured.data[0].category && (
                      <span
                        className="rounded-full px-3 py-0.5 text-[11px] font-medium"
                        style={{
                          backgroundColor: `${featured.data[0].category.color ?? "#7B6FFF"}18`,
                          color: featured.data[0].category.color ?? "#9F98FF",
                        }}
                      >
                        {featured.data[0].category.name}
                      </span>
                    )}
                    <span className="rounded-full bg-[#FFB02E18] px-2.5 py-0.5 text-[10px] font-bold text-[#FFB02E]">
                      Онцлох
                    </span>
                  </div>
                  <h2 className="mb-3 font-syne text-2xl font-bold leading-tight">
                    {featured.data[0].title}
                  </h2>
                  {featured.data[0].excerpt && (
                    <p className="mb-4 line-clamp-3 text-[14px] leading-relaxed text-white/45">
                      {featured.data[0].excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-[12px] text-white/35">
                    <span>{featured.data[0].author?.name}</span>
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {featured.data[0].publishedAt
                        ? formatDate(featured.data[0].publishedAt)
                        : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={11} />
                      {featured.data[0].viewCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ── Category Tabs ── */}
      <div className="mx-auto mb-8 flex max-w-5xl flex-wrap justify-center gap-2 px-6">
        <button
          onClick={() => {
            setCategory(undefined);
            setPage(1);
          }}
          className={`rounded-full px-5 py-2 text-[13px] font-medium transition-all ${
            !category
              ? "bg-[#7B6FFF] text-white shadow-[0_0_20px_#7B6FFF40]"
              : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70"
          }`}
        >
          Бүгд
        </button>
        {categories.data?.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setCategory(cat.slug);
              setPage(1);
            }}
            className={`rounded-full px-5 py-2 text-[13px] font-medium transition-all ${
              category === cat.slug
                ? "bg-[#7B6FFF] text-white shadow-[0_0_20px_#7B6FFF40]"
                : "bg-white/[0.04] text-white/50 hover:bg-white/[0.08] hover:text-white/70"
            }`}
          >
            {cat.name}
            <span className="ml-1.5 text-[11px] opacity-60">
              {cat._count.posts}
            </span>
          </button>
        ))}
      </div>

      {/* ── Posts Grid ── */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 px-6 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {posts.isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[360px] animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.02]"
            />
          ))}

        {posts.data?.posts?.map((post: any) => {
          const categoryColor = post.category?.color ?? "#7B6FFF";
          return (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-[#7B6FFF30] hover:bg-white/[0.04]">
              {post.coverImage ? (
                <div className="aspect-[16/10] overflow-hidden">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.parentElement?.classList.add("fallback-bg");
                    }}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div
                  className="relative flex aspect-[16/10] items-center justify-center overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${categoryColor}22 0%, ${categoryColor}08 50%, #00E5B808 100%)`,
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `radial-gradient(circle at 20% 30%, ${categoryColor}40 0%, transparent 40%), radial-gradient(circle at 80% 70%, #00E5B830 0%, transparent 40%)`,
                    }}
                  />
                  <div className="relative z-10 flex flex-col items-center gap-2 text-center px-4">
                    <BookOpen size={28} style={{ color: `${categoryColor}AA` }} />
                    <span className="font-syne text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
                      {post.category?.name ?? "Nuul.digital"}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                {post.category && (
                  <span
                    className="mb-2 w-fit rounded-full px-2.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${categoryColor}18`,
                      color: categoryColor,
                    }}
                  >
                    {post.category.name}
                  </span>
                )}
                <h3 className="mb-2 line-clamp-2 font-syne text-[15px] font-bold leading-snug">
                  {post.title}
                </h3>
                {post.excerpt ? (
                  <p className="mb-3 line-clamp-2 flex-1 text-[12px] leading-relaxed text-white/40">
                    {post.excerpt}
                  </p>
                ) : (
                  <p className="mb-3 line-clamp-2 flex-1 text-[12px] leading-relaxed text-white/25 italic">
                    Дэлгэрэнгүй унших...
                  </p>
                )}
                <div className="mt-auto flex items-center gap-3 text-[11px] text-white/30">
                  <span>{post.author?.name}</span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {post.publishedAt ? formatDate(post.publishedAt) : ""}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye size={10} />
                    {post.viewCount}
                  </span>
                </div>
              </div>
            </article>
          </Link>
          );
        })}

        {posts.data?.posts?.length === 0 && (
          <div className="col-span-full py-20 text-center text-white/30">
            Нийтлэл олдсонгүй.
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {posts.data && posts.data.totalPages > 1 && (
        <div className="mx-auto mb-20 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border border-white/[0.08] p-2.5 text-white/40 transition-all hover:bg-white/[0.04] disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[13px] text-white/50">
            {page} / {posts.data.totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(posts.data!.totalPages, p + 1))
            }
            disabled={page === posts.data.totalPages}
            className="rounded-xl border border-white/[0.08] p-2.5 text-white/40 transition-all hover:bg-white/[0.04] disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
