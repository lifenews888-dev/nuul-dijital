import { saveFaq } from "@/app/admin/actions";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";

type Faq = {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  published: boolean;
};

export function FaqForm({ faq }: { faq?: Faq }) {
  return (
    <form action={saveFaq} className="max-w-2xl">
      {faq && <input type="hidden" name="id" value={faq.id} />}
      <div className="grid gap-5">
        <TextField name="question" label="Асуулт" defaultValue={faq?.question} required />
        <TextAreaField name="answer" label="Хариулт" defaultValue={faq?.answer} required rows={5} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="category" label="Ангилал" defaultValue={faq?.category ?? "Ерөнхий"} />
          <TextField name="order" label="Дараалал" type="number" defaultValue={faq?.order ?? 0} />
        </div>
        <CheckboxField name="published" label="Нийтлэх" defaultChecked={faq?.published ?? true} />
        <div>
          <Button type="submit" variant="gradient" size="lg">
            {faq ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
