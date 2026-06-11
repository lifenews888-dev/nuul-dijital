import { saveTestimonial } from "@/app/admin/actions";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/fields";
import { Button } from "@/components/ui/button";

type Testimonial = {
  id: string;
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
  avatar: string;
  order: number;
  published?: boolean;
};

export function TestimonialForm({ testimonial }: { testimonial?: Testimonial }) {
  return (
    <form action={saveTestimonial} className="max-w-2xl">
      {testimonial && <input type="hidden" name="id" value={testimonial.id} />}
      <div className="grid gap-5">
        <TextAreaField name="quote" label="Сэтгэгдэл" defaultValue={testimonial?.quote} required rows={4} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="author" label="Нэр" defaultValue={testimonial?.author} required />
          <TextField name="role" label="Албан тушаал" defaultValue={testimonial?.role} required />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="company" label="Байгууллага" defaultValue={testimonial?.company} required />
          <TextField name="avatar" label="Зураг (URL)" defaultValue={testimonial?.avatar} required />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="rating" label="Үнэлгээ (1-5)" type="number" defaultValue={testimonial?.rating ?? 5} />
          <TextField name="order" label="Дараалал" type="number" defaultValue={testimonial?.order ?? 0} />
        </div>
        <CheckboxField name="published" label="Нийтлэх" defaultChecked={testimonial?.published ?? true} />
        <div>
          <Button type="submit" variant="gradient" size="lg">
            {testimonial ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
