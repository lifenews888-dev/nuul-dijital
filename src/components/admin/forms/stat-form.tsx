import { saveStat } from "@/app/admin/actions";
import { TextField, CheckboxField } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";

type Stat = {
  id: string;
  value: number;
  suffix: string;
  label: string;
  order: number;
  active: boolean;
};

export function StatForm({ stat }: { stat?: Stat }) {
  return (
    <form action={saveStat} className="max-w-2xl">
      {stat && <input type="hidden" name="id" value={stat.id} />}
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="value" label="Тоон утга" type="number" defaultValue={stat?.value ?? 0} required />
          <TextField name="suffix" label="Дагавар (+, %, жил…)" defaultValue={stat?.suffix ?? ""} />
        </div>
        <TextField name="label" label="Тайлбар" defaultValue={stat?.label} required />
        <TextField name="order" label="Дараалал" type="number" defaultValue={stat?.order ?? 0} />
        <CheckboxField name="active" label="Идэвхтэй (харагдана)" defaultChecked={stat?.active ?? true} />
        <div>
          <Button type="submit" variant="gradient" size="lg">
            {stat ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
