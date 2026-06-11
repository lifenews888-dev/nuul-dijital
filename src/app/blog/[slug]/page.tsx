import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock } from "lucide-react";
import { posts, getPost } from "@/data/posts";
import { GradientMesh } from "@/components/shared/gradient-mesh";
import { CTASection } from "@/components/sections/cta-section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/shared/json-ld";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { formatDate, readingTime } from "@/lib/utils";

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) return buildMetadata({ title: "Олдсонгүй" });
  return buildMetadata({
    title: p.title,
    description: p.excerpt,
    path: `/blog/${slug}`,
    image: p.cover,
    type: "article",
    publishedTime: p.date,
    keywords: p.tags,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getPost(slug);
  if (!p) notFound();

  const related = posts.filter((x) => x.slug !== slug).slice(0, 3);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: p.title,
          description: p.excerpt,
          image: p.cover,
          datePublished: p.date,
          author: { "@type": "Person", name: p.author },
          publisher: { "@type": "Organization", name: siteConfig.name },
        }}
      />

      <article>
        <section className="relative overflow-hidden pb-10 pt-36 lg:pt-44">
          <GradientMesh />
          <div className="container-wide">
            <div className="mx-auto max-w-3xl">
              <Badge variant="accent">{p.category}</Badge>
              <h1 className="mt-5 text-display-lg font-extrabold tracking-tight">{p.title}</h1>
              <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{p.author}</span>
                <span>·</span>
                <time>{formatDate(p.date)}</time>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4" /> {readingTime(p.content)} мин унших
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="container-wide pb-16">
          <div className="relative mx-auto aspect-[16/9] max-w-4xl overflow-hidden rounded-3xl border border-white/10">
            <Image src={p.cover} alt={p.title} fill priority sizes="100vw" className="object-cover" />
          </div>

          <div className="mx-auto mt-12 max-w-3xl">
            <p className="text-xl font-medium leading-relaxed text-foreground">{p.excerpt}</p>
            <div className="mt-6 flex flex-col gap-5 text-lg leading-relaxed text-muted-foreground">
              {p.content.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {p.tags.map((t) => (
                <Badge key={t}>#{t}</Badge>
              ))}
            </div>
            <Button asChild variant="ghost" className="mt-10">
              <Link href="/blog">
                <ArrowLeft className="size-4" /> Бүх нийтлэл
              </Link>
            </Button>
          </div>
        </div>
      </article>

      <section className="container-wide pb-12">
        <h2 className="text-2xl font-bold">Холбоотой нийтлэл</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {related.map((r) => (
            <Link
              key={r.slug}
              href={`/blog/${r.slug}`}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-card"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={r.cover}
                  alt={r.title}
                  fill
                  sizes="33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <Badge variant="accent">{r.category}</Badge>
                <h3 className="mt-2 font-semibold leading-snug">{r.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CTASection />
    </>
  );
}
