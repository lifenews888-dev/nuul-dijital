import { saveService } from "@/app/(admin)/admin/catalogue/actions";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-field";
import { ImageListField } from "@/components/admin/image-list-field";
import { IconPickerField } from "@/components/admin/icon-picker-field";
import { Button } from "@/components/ui/button";

type Service = {
  id: string;
  slug: string;
  title: string;
  short: string;
  description: string;
  features: string[];
  deliverables: string[];
  icon: string;
  accent: string | null;
  image: string | null;
  gallery: string[];
  videoUrl: string | null;
  priceMnt: number | null;
  priceNote: string | null;
  featured: boolean;
  order: number;
  active: boolean;
};

export function ServiceForm({ service }: { service?: Service }) {
  return (
    <form action={saveService} className="max-w-3xl">
      {service && <input type="hidden" name="id" value={service.id} />}
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="title" label="Нэр" defaultValue={service?.title} required />
          <TextField name="slug" label="Slug" defaultValue={service?.slug} required />
        </div>

        <IconPickerField name="icon" label="Дүрс" defaultValue={service?.icon} />

        <TextAreaField
          name="short"
          label="Товч тайлбар"
          defaultValue={service?.short}
          required
          rows={2}
          hint="Картан дээр харагдана"
        />
        <TextAreaField
          name="description"
          label="Дэлгэрэнгүй тайлбар"
          defaultValue={service?.description}
          required
          rows={4}
        />
        <TextAreaField
          name="features"
          label="Онцлогууд"
          defaultValue={service?.features.join("\n")}
          hint="Мөр бүрт нэг"
          rows={4}
        />
        <TextAreaField
          name="deliverables"
          label="Хүлээлгэн өгөх зүйлс"
          defaultValue={service?.deliverables.join("\n")}
          hint="Мөр бүрт нэг"
          rows={3}
        />

        <ImageField
          name="image"
          label="Танилцуулга зураг"
          defaultValue={service?.image ?? ""}
          hint="JPG, PNG — 4MB хүртэл"
        />
        <ImageListField
          name="gallery"
          label="Зургийн цомог"
          defaultValue={(service?.gallery ?? []).join("\n")}
          hint="Олон зураг зэрэг сонгож болно"
        />
        <TextField
          name="videoUrl"
          label="Видео танилцуулга (URL)"
          defaultValue={service?.videoUrl ?? ""}
          placeholder="YouTube, Vimeo эсвэл .mp4 холбоос"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="priceMnt"
            label="Үнэ (₮)"
            type="number"
            defaultValue={service?.priceMnt ?? ""}
            placeholder="Хоосон бол үнэ харагдахгүй"
          />
          <TextField
            name="priceNote"
            label="Үнийн тайлбар"
            defaultValue={service?.priceNote ?? ""}
            placeholder="Жишээ: -аас эхлэлтэй"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="accent"
            label="Өнгө"
            defaultValue={service?.accent ?? ""}
            placeholder="blue эсвэл cyan"
          />
          <TextField name="order" label="Дараалал" type="number" defaultValue={service?.order ?? 0} />
        </div>

        <CheckboxField name="featured" label="Онцлох" defaultChecked={service?.featured} />
        <CheckboxField
          name="active"
          label="Идэвхтэй (харагдана)"
          defaultChecked={service ? service.active : true}
        />

        <div>
          <Button type="submit" variant="gradient" size="lg">
            {service ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
