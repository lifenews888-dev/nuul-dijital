import { savePage } from "@/app/admin/actions";
import { TextField, TextAreaField } from "@/components/admin/fields";
import { StatusFields, SeoFields } from "@/components/admin/forms/content-fields";
import { Button } from "@/components/ui/button";

type Page = {
  id: string;
  slug: string;
  title: string;
  content: string;
  status?: string;
  scheduledAt?: Date | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  ogImage?: string | null;
  canonicalUrl?: string | null;
};

export function PageForm({ page }: { page?: Page }) {
  return (
    <form action={savePage} className="max-w-3xl">
      {page && <input type="hidden" name="id" value={page.id} />}
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="title" label="Гарчиг" defaultValue={page?.title} required />
          <TextField name="slug" label="Slug" defaultValue={page?.slug} required placeholder="about-us" />
        </div>
        <TextAreaField name="content" label="Агуулга (Markdown/HTML)" defaultValue={page?.content} required rows={12} />
        <StatusFields status={page?.status} scheduledAt={page?.scheduledAt} />
        <SeoFields seo={page} />
        <div>
          <Button type="submit" variant="gradient" size="lg">
            {page ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
