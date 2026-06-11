import { saveValue } from "@/app/admin/actions";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";

type Value = {
  id: string;
  title: string;
  description: string;
  order: number;
  active: boolean;
};

export function ValueForm({ value }: { value?: Value }) {
  return (
    <form action={saveValue} className="max-w-2xl">
      {value && <input type="hidden" name="id" value={value.id} />}
      <div className="grid gap-5">
        <TextField name="title" label="Гарчиг" defaultValue={value?.title} required />
        <TextAreaField name="description" label="Тайлбар" defaultValue={value?.description} required rows={4} />
        <TextField name="order" label="Дараалал" type="number" defaultValue={value?.order ?? 0} />
        <CheckboxField name="active" label="Идэвхтэй (харагдана)" defaultChecked={value?.active ?? true} />
        <div>
          <Button type="submit" variant="gradient" size="lg">
            {value ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
