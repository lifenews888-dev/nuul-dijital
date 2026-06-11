import { PageHeader } from "@/components/shared/page-header";
import { BlogList } from "@/components/blog/blog-list";
import { getPosts } from "@/lib/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Блог",
  description: "Технологи, дизайн, AI, бизнесийн өсөлтийн талаарх инсайт, гарын авлага.",
  path: "/blog",
});

export default async function BlogPage() {
  const posts = await getPosts();
  return (
    <>
      <PageHeader
        label="Блог"
        title={
          <>
            Инсайт ба <span className="text-gradient-accent">гарын авлага</span>
          </>
        }
        description="Дижитал ертөнцийн хамгийн сүүлийн чиг хандлага, практик зөвлөгөөг бид хуваалцаж байна."
      />
      <section className="container-wide pb-24">
        <BlogList posts={posts} />
      </section>
    </>
  );
}
