import { saveProcessStep } from "@/app/admin/actions";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";
import { ICON_NAMES } from "@/lib/icons";

type ProcessStep = {
  id: string;
  step: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  active: boolean;
};

export function ProcessForm({ step }: { step?: ProcessStep }) {
  return (
    <form action={saveProcessStep} className="max-w-2xl">
      {step && <input type="hidden" name="id" value={step.id} />}
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="step" label="Дугаар (01, 02…)" defaultValue={step?.step} required />
          <TextField name="title" label="Гарчиг" defaultValue={step?.title} required />
        </div>
        <TextAreaField name="description" label="Тайлбар" defaultValue={step?.description} required rows={3} />
        <TextField
          name="icon"
          label={`Icon нэр (${ICON_NAMES.join(", ")})`}
          defaultValue={step?.icon ?? "Sparkles"}
        />
        <TextField name="order" label="Дараалал" type="number" defaultValue={step?.order ?? 0} />
        <CheckboxField name="active" label="Идэвхтэй (харагдана)" defaultChecked={step?.active ?? true} />
        <div>
          <Button type="submit" variant="gradient" size="lg">
            {step ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
