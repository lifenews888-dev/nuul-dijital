import { getTranslations } from "next-intl/server";
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
  const [posts, t] = await Promise.all([getPosts(), getTranslations("pages.blog")]);
  return (
    <>
      <PageHeader
        label={t("label")}
        title={t.rich("title", { accent: (c) => <span className="text-gradient-accent">{c}</span> })}
        description={t("description")}
      />
      <section className="container-wide pb-24">
        <BlogList posts={posts} />
      </section>
    </>
  );
}
