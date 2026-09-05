import { saveSoftwareCategory } from "@/app/(admin)/admin/catalogue/actions";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/fields";
import { GROUP_LABELS, GROUP_ORDER } from "@/data/software";
import { Button } from "@/components/ui/button";

type Category = {
  id: string;
  slug: string;
  title: string;
  description: string;
  group: string;
  order: number;
  active: boolean;
};

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-foreground outline-none transition-colors focus:border-accent";

export function SoftwareCategoryForm({ category }: { category?: Category }) {
  return (
    <form action={saveSoftwareCategory} className="max-w-2xl">
      {category && <input type="hidden" name="id" value={category.id} />}
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="title" label="Нэр" defaultValue={category?.title} required />
          <TextField name="slug" label="Slug" defaultValue={category?.slug} required />
        </div>

        <TextAreaField
          name="description"
          label="Тайлбар"
          defaultValue={category?.description}
          required
          rows={3}
          hint="Ангиллын хуудсанд харагдана — 1-2 өгүүлбэр"
        />

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground/90">
            Бүлэг <span className="text-accent">*</span>
          </span>
          <select
            name="group"
            defaultValue={category?.group ?? GROUP_ORDER[0]}
            className={SELECT_CLASS}
          >
            {GROUP_ORDER.map((g) => (
              <option key={g} value={g}>
                {GROUP_LABELS[g]}
              </option>
            ))}
          </select>
        </label>

        <TextField name="order" label="Дараалал" type="number" defaultValue={category?.order ?? 0} />

        <CheckboxField
          name="active"
          label="Идэвхтэй (харагдана)"
          defaultChecked={category ? category.active : true}
        />

        <div>
          <Button type="submit" variant="gradient" size="lg">
            {category ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
