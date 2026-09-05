import { saveSoftwareVendor } from "@/app/(admin)/admin/catalogue/actions";
import { TextField, TextAreaField, CheckboxField } from "@/components/admin/fields";
import { ImageField } from "@/components/admin/image-field";
import { ImageListField } from "@/components/admin/image-list-field";
import { IconPickerField } from "@/components/admin/icon-picker-field";
import { FOCUS_LABELS } from "@/data/software";
import { Button } from "@/components/ui/button";

type Vendor = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  products: string[];
  editions: string[];
  audience: string;
  focus: string;
  icon: string;
  accent: string | null;
  image: string | null;
  gallery: string[];
  videoUrl: string | null;
  priceMnt: number | null;
  priceNote: string | null;
  featured: boolean;
  priority: number;
  active: boolean;
  categories: { slug: string }[];
};

const SELECT_CLASS =
  "h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-foreground outline-none transition-colors focus:border-accent";

export function SoftwareVendorForm({
  vendor,
  categories,
}: {
  vendor?: Vendor;
  categories: { slug: string; title: string; group: string }[];
}) {
  const selected = new Set((vendor?.categories ?? []).map((c) => c.slug));

  return (
    <form action={saveSoftwareVendor} className="max-w-3xl">
      {vendor && <input type="hidden" name="id" value={vendor.id} />}
      <div className="grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="name" label="Нэр" defaultValue={vendor?.name} required />
          <TextField name="slug" label="Slug" defaultValue={vendor?.slug} required />
        </div>

        <IconPickerField name="icon" label="Дүрс" defaultValue={vendor?.icon} />

        <TextField name="tagline" label="Товч уриа" defaultValue={vendor?.tagline} required />
        <TextAreaField
          name="description"
          label="Тайлбар"
          defaultValue={vendor?.description}
          required
          rows={4}
        />
        <TextAreaField
          name="products"
          label="Бүтээгдэхүүн"
          defaultValue={vendor?.products.join("\n")}
          hint="Мөр бүрт нэг"
          rows={6}
        />
        <TextAreaField
          name="editions"
          label="Лицензийн хувилбар"
          defaultValue={(vendor?.editions ?? []).join("\n")}
          hint="Мөр бүрт нэг — хоосон орхиж болно"
          rows={2}
        />
        <TextAreaField
          name="audience"
          label="Хэнд тохиромжтой"
          defaultValue={vendor?.audience}
          required
          rows={2}
        />

        <label className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground/90">
            Чиглэл <span className="text-accent">*</span>
          </span>
          <select name="focus" defaultValue={vendor?.focus ?? "security"} className={SELECT_CLASS}>
            {Object.entries(FOCUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-foreground/90">Хамрах ангилал</span>
          <div className="grid max-h-64 gap-1.5 overflow-y-auto rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:grid-cols-2">
            {categories.map((c) => (
              <label key={c.slug} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/5">
                <input
                  type="checkbox"
                  name="categories"
                  value={c.slug}
                  defaultChecked={selected.has(c.slug)}
                  className="size-4 rounded border-white/20 bg-white/5 accent-accent"
                />
                <span className="text-sm text-muted-foreground">{c.title}</span>
              </label>
            ))}
          </div>
        </div>

        <ImageField
          name="image"
          label="Танилцуулга зураг"
          defaultValue={vendor?.image ?? ""}
          hint="JPG, PNG — 4MB хүртэл"
        />
        <ImageListField
          name="gallery"
          label="Зургийн цомог"
          defaultValue={(vendor?.gallery ?? []).join("\n")}
          hint="Олон зураг зэрэг сонгож болно"
        />
        <TextField
          name="videoUrl"
          label="Видео танилцуулга (URL)"
          defaultValue={vendor?.videoUrl ?? ""}
          placeholder="YouTube, Vimeo эсвэл .mp4 холбоос"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="priceMnt"
            label="Үнэ (₮)"
            type="number"
            defaultValue={vendor?.priceMnt ?? ""}
            placeholder="Хоосон бол үнэ харагдахгүй"
          />
          <TextField
            name="priceNote"
            label="Үнийн тайлбар"
            defaultValue={vendor?.priceNote ?? ""}
            placeholder="Жишээ: хэрэглэгч тутамд / жилээр"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            name="accent"
            label="Өнгө"
            defaultValue={vendor?.accent ?? ""}
            placeholder="blue эсвэл cyan"
          />
          <TextField
            name="priority"
            label="Эрэмбэ"
            type="number"
            defaultValue={vendor?.priority ?? 0}
          />
        </div>

        <CheckboxField name="featured" label="Түгээмэл" defaultChecked={vendor?.featured} />
        <CheckboxField
          name="active"
          label="Идэвхтэй (харагдана)"
          defaultChecked={vendor ? vendor.active : true}
        />

        <div>
          <Button type="submit" variant="gradient" size="lg">
            {vendor ? "Хадгалах" : "Үүсгэх"}
          </Button>
        </div>
      </div>
    </form>
  );
}
