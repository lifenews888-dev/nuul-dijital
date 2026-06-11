import { saveProject } from "@/app/admin/actions";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/fields";
import { StatusFields, SeoFields } from "@/components/admin/forms/content-fields";
import { Button } from "@/components/ui/button";

type Project = {
  id: string;
  slug: string;
  name: string;
  industry: string;
  description: string;
  technologies: string[];
  results: unknown;
  image: string;
  gallery: string[];
  link: string | null;
  year: string;
  services: string[];
  featured: boolean;
  status?: string;
  scheduledAt?: Date | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  ogImage?: string | null;
  canonicalUrl?: string | null;
};

export function ProjectForm({ project }: { project?: Project }) {
  return (
    <form action={saveProject} className="max-w-3xl">
      {project && <input type="hidden" name="id" value={project.id} />}
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="name" label="Нэр" defaultValue={project?.name} required />
          <TextField name="slug" label="Slug" defaultValue={project?.slug} required />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="industry" label="Салбар" defaultValue={project?.industry} required />
          <TextField name="year" label="Он" defaultValue={project?.year} required />
        </div>
        <TextAreaField name="description" label="Тайлбар" defaultValue={project?.description} required rows={3} />
        <TextField name="image" label="Үндсэн зураг (URL)" defaultValue={project?.image} required />
        <TextField name="link" label="Вэб холбоос" defaultValue={project?.link ?? ""} />
        <TextAreaField
          name="technologies"
          label="Технологи"
          defaultValue={project?.technologies.join("\n")}
          hint="Мөр бүрт нэг"
          rows={3}
        />
        <TextAreaField
          name="services"
          label="Үйлчилгээ"
          defaultValue={project?.services.join("\n")}
          hint="Мөр бүрт нэг"
          rows={3}
        />
        <TextAreaField
          name="gallery"
          label="Зургийн цомог"
          defaultValue={project?.gallery.join("\n")}
          hint="Зурагны URL — мөр бүрт нэг"
          rows={3}
        />
        <TextAreaField
          name="results"
          label="Үр дүн (JSON)"
          defaultValue={project ? JSON.stringify(project.results, null, 2) : '[\n  { "label": "Хэрэглэгчийн идэвх", "value": "+68%" }\n]'}
          hint='Жишээ: [{ "label": "...", "value": "+68%" }]'
          rows={6}
        />
        <CheckboxField name="featured" label="Онцлох (нүүр хуудсанд)" defaultChecked={project?.featured} />
        <StatusFields status={project?.status} scheduledAt={project?.scheduledAt} />
        <SeoFields seo={project} />
        <div>
          <Button type="submit" variant="gradient" size="lg">
            {project ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
