import { saveJob } from "@/app/admin/actions";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";

type Job = {
  id: string;
  slug: string;
  title: string;
  department: string;
  location: string;
  type: string;
  level: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  active: boolean;
};

export function JobForm({ job }: { job?: Job }) {
  return (
    <form action={saveJob} className="max-w-3xl">
      {job && <input type="hidden" name="id" value={job.id} />}
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="title" label="Албан тушаал" defaultValue={job?.title} required />
          <TextField name="slug" label="Slug" defaultValue={job?.slug} required />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField name="department" label="Хэлтэс" defaultValue={job?.department} required />
          <TextField name="location" label="Байршил" defaultValue={job?.location} required />
          <TextField name="type" label="Төрөл" defaultValue={job?.type} required placeholder="Бүтэн цаг" />
        </div>
        <TextField name="level" label="Түвшин" defaultValue={job?.level} required placeholder="Ахлах" />
        <TextAreaField name="summary" label="Тойм" defaultValue={job?.summary} required rows={3} />
        <TextAreaField
          name="responsibilities"
          label="Хариуцах ажил"
          defaultValue={job?.responsibilities.join("\n")}
          hint="Мөр бүрт нэг зүйл"
          rows={5}
        />
        <TextAreaField
          name="requirements"
          label="Шаардлага"
          defaultValue={job?.requirements.join("\n")}
          hint="Мөр бүрт нэг зүйл"
          rows={5}
        />
        <CheckboxField name="active" label="Идэвхтэй (нийтлэгдсэн)" defaultChecked={job?.active ?? true} />
        <div>
          <Button type="submit" variant="gradient" size="lg">
            {job ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
