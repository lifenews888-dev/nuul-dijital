import { TextField, TextAreaField } from "@/components/admin/fields";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Ноорог" },
  { value: "PUBLISHED", label: "Нийтлэгдсэн" },
  { value: "SCHEDULED", label: "Товлосон" },
  { value: "ARCHIVED", label: "Архивласан" },
];

function toLocalInput(d?: Date | string | null) {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

type SeoLike = {
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  ogImage?: string | null;
  canonicalUrl?: string | null;
};

/** Publishing status + scheduling. */
export function StatusFields({
  status = "DRAFT",
  scheduledAt,
}: {
  status?: string;
  scheduledAt?: Date | string | null;
}) {
  return (
    <fieldset className="grid gap-5 rounded-2xl border border-white/10 p-5 sm:grid-cols-2">
      <legend className="px-2 text-sm font-semibold text-foreground">Төлөв ба хуваарь</legend>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground/90">Төлөв</span>
        <select
          name="status"
          defaultValue={status}
          className="h-12 rounded-xl border border-input bg-white/[0.03] px-4 text-sm focus:border-accent/50 focus:outline-none"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-card">
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground/90">Товлосон огноо (SCHEDULED үед)</span>
        <input
          type="datetime-local"
          name="scheduledAt"
          defaultValue={toLocalInput(scheduledAt)}
          className="h-12 rounded-xl border border-input bg-white/[0.03] px-4 text-sm focus:border-accent/50 focus:outline-none"
        />
      </label>
    </fieldset>
  );
}

/** SEO manager: title, description, keywords, OpenGraph image, canonical URL. */
export function SeoFields({ seo }: { seo?: SeoLike }) {
  return (
    <fieldset className="grid gap-5 rounded-2xl border border-white/10 p-5">
      <legend className="px-2 text-sm font-semibold text-foreground">SEO</legend>
      <TextField name="seoTitle" label="SEO гарчиг" defaultValue={seo?.seoTitle ?? ""} />
      <TextAreaField
        name="seoDescription"
        label="SEO тайлбар (meta description)"
        defaultValue={seo?.seoDescription ?? ""}
        rows={2}
      />
      <TextAreaField
        name="seoKeywords"
        label="Түлхүүр үг"
        defaultValue={seo?.seoKeywords?.join("\n") ?? ""}
        hint="Мөр бүрт нэг түлхүүр үг"
        rows={3}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField name="ogImage" label="OpenGraph зураг (URL)" defaultValue={seo?.ogImage ?? ""} />
        <TextField name="canonicalUrl" label="Canonical URL" defaultValue={seo?.canonicalUrl ?? ""} />
      </div>
    </fieldset>
  );
}
