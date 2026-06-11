import { saveCaseStudy } from "@/app/admin/actions";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/fields";
import { StatusFields, SeoFields } from "@/components/admin/forms/content-fields";
import { Button } from "@/components/ui/button";

type CaseStudy = {
  id: string;
  slug: string;
  title: string;
  client: string;
  industry: string;
  excerpt: string;
  cover: string;
  duration: string;
  services: string[];
  challenge: string;
  approach: string[];
  solution: string;
  results: unknown;
  testimonial: unknown;
  featured: boolean;
  status?: string;
  scheduledAt?: Date | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  ogImage?: string | null;
  canonicalUrl?: string | null;
};

export function CaseStudyForm({ caseStudy }: { caseStudy?: CaseStudy }) {
  return (
    <form action={saveCaseStudy} className="max-w-3xl">
      {caseStudy && <input type="hidden" name="id" value={caseStudy.id} />}
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="title" label="Гарчиг" defaultValue={caseStudy?.title} required />
          <TextField name="slug" label="Slug" defaultValue={caseStudy?.slug} required />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField name="client" label="Үйлчлүүлэгч" defaultValue={caseStudy?.client} required />
          <TextField name="industry" label="Салбар" defaultValue={caseStudy?.industry} required />
          <TextField name="duration" label="Хугацаа" defaultValue={caseStudy?.duration} required />
        </div>
        <TextField name="cover" label="Cover зураг (URL)" defaultValue={caseStudy?.cover} required />
        <TextAreaField name="excerpt" label="Хураангуй" defaultValue={caseStudy?.excerpt} required rows={2} />
        <TextAreaField name="challenge" label="Сорилт" defaultValue={caseStudy?.challenge} required rows={4} />
        <TextAreaField name="solution" label="Шийдэл" defaultValue={caseStudy?.solution} required rows={4} />
        <TextAreaField
          name="approach"
          label="Хандлага"
          defaultValue={caseStudy?.approach.join("\n")}
          hint="Мөр бүрт нэг алхам"
          rows={4}
        />
        <TextAreaField
          name="services"
          label="Үйлчилгээ"
          defaultValue={caseStudy?.services.join("\n")}
          hint="Мөр бүрт нэг"
          rows={3}
        />
        <TextAreaField
          name="results"
          label="Үр дүн (JSON)"
          defaultValue={caseStudy ? JSON.stringify(caseStudy.results, null, 2) : '[\n  { "label": "...", "value": "+68%" }\n]'}
          rows={5}
        />
        <TextAreaField
          name="testimonial"
          label="Сэтгэгдэл (JSON, заавал биш)"
          defaultValue={caseStudy?.testimonial ? JSON.stringify(caseStudy.testimonial, null, 2) : ""}
          hint='Жишээ: { "quote": "...", "author": "...", "role": "..." }'
          rows={4}
        />
        <CheckboxField name="featured" label="Онцлох" defaultChecked={caseStudy?.featured} />
        <StatusFields status={caseStudy?.status} scheduledAt={caseStudy?.scheduledAt} />
        <SeoFields seo={caseStudy} />
        <div>
          <Button type="submit" variant="gradient" size="lg">
            {caseStudy ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
