import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/** Presentational field wrappers for admin forms (uncontrolled, native form submit). */

export function TextField({
  name,
  label,
  defaultValue,
  required,
  placeholder,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground/90">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      <Input
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

export function TextAreaField({
  name,
  label,
  defaultValue,
  required,
  placeholder,
  hint,
  rows = 5,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground/90">
        {label} {required && <span className="text-accent">*</span>}
      </span>
      <Textarea name={name} defaultValue={defaultValue} required={required} placeholder={placeholder} rows={rows} />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function CheckboxField({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="size-5 rounded border-white/20 bg-white/5 text-accent accent-accent"
      />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}
