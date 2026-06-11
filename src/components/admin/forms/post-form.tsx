import { savePost } from "@/app/admin/actions";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/fields";
import { StatusFields, SeoFields } from "@/components/admin/forms/content-fields";
import { Button } from "@/components/ui/button";

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  cover: string;
  tags: string[];
  featured: boolean;
  status: string;
  scheduledAt: Date | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  ogImage: string | null;
  canonicalUrl: string | null;
};

export function PostForm({ post }: { post?: Post }) {
  return (
    <form action={savePost} className="max-w-3xl">
      {post && <input type="hidden" name="id" value={post.id} />}
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="title" label="Гарчиг" defaultValue={post?.title} required />
          <TextField name="slug" label="Slug" defaultValue={post?.slug} required placeholder="ai-mongolian-business" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="category" label="Ангилал" defaultValue={post?.category} required />
          <TextField name="cover" label="Cover зураг (URL)" defaultValue={post?.cover} required />
        </div>
        <TextAreaField name="excerpt" label="Хураангуй" defaultValue={post?.excerpt} required rows={2} />
        <TextAreaField name="content" label="Агуулга" defaultValue={post?.content} required rows={10} />
        <TextAreaField
          name="tags"
          label="Шошго"
          defaultValue={post?.tags.join("\n")}
          hint="Мөр бүрт нэг шошго"
          rows={3}
        />
        <CheckboxField name="featured" label="Онцлох" defaultChecked={post?.featured} />
        <StatusFields status={post?.status} scheduledAt={post?.scheduledAt} />
        <SeoFields seo={post} />
        <div>
          <Button type="submit" variant="gradient" size="lg">
            {post ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
