import Link from "next/link";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUS_MAP: Record<string, { label: string; variant: "default" | "accent" | "cyan" }> = {
  PUBLISHED: { label: "Нийтлэгдсэн", variant: "accent" },
  DRAFT: { label: "Ноорог", variant: "default" },
  SCHEDULED: { label: "Товлосон", variant: "cyan" },
  ARCHIVED: { label: "Архив", variant: "default" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.DRAFT;
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

export function AdminHeader({
  title,
  description,
  newHref,
  newLabel = "Шинээр нэмэх",
}: {
  title: string;
  description?: string;
  newHref?: string;
  newLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {newHref && (
        <Link
          href={newHref}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
        >
          <Plus className="size-4" /> {newLabel}
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center text-muted-foreground">
      {message}
      {!process.env.DATABASE_URL && (
        <p className="mt-2 text-xs">
          (DATABASE_URL тохируулагдаагүй байна — өгөгдлийн сан холбогдсоны дараа жагсаалт харагдана.)
        </p>
      )}
    </div>
  );
}

export function TableShell({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02] text-left text-xs uppercase tracking-wide text-muted-foreground">
              {head.map((h) => (
                <th key={h} className="px-4 py-3 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
