import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { setBriefStatus, deleteBrief } from "@/app/admin/actions";
import { AdminHeader, EmptyState } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { StatusSelect } from "@/components/admin/status-select";
import { Badge } from "@/components/ui/badge";
import { formatMnt } from "@/lib/estimate";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS = [
  { value: "NEW", label: "Шинэ" },
  { value: "CONTACTED", label: "Холбогдсон" },
  { value: "QUALIFIED", label: "Шалгарсан" },
  { value: "WON", label: "Хожсон" },
  { value: "LOST", label: "Алдсан" },
];

const yn = (v: boolean | null) => (v === true ? "Тийм" : v === false ? "Үгүй" : "—");

export default async function AdminBriefsPage() {
  await requireUser();
  const briefs = await safe(
    () => db.projectBrief.findMany({ orderBy: { createdAt: "desc" } }),
    [] as Awaited<ReturnType<typeof db.projectBrief.findMany>>
  );

  return (
    <div>
      <AdminHeader title="Загвар сайт хүсэлтүүд" description="Дэлгэрэнгүй төслийн брифүүд" />
      {briefs.length === 0 ? (
        <EmptyState message="Бриф хүсэлт алга байна." />
      ) : (
        <div className="flex flex-col gap-4">
          {briefs.map((b) => (
            <div key={b.id} className="rounded-2xl border border-white/10 bg-card p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/briefs/${b.id}`} className="text-lg font-bold hover:text-accent">
                      {b.name}
                    </Link>
                    {b.projectTypes.map((t) => (
                      <Badge key={t} variant="accent">{t}</Badge>
                    ))}
                    {b.quoteSentAt && <Badge variant="cyan">Илгээсэн</Badge>}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {b.email} · {b.phone}
                    {b.company ? ` · ${b.company}` : ""}
                    {b.location ? ` · ${b.location}` : ""}
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="text-muted-foreground">Үнэлгээ:</span>{" "}
                    <span className="font-semibold text-accent-cyan">
                      {b.finalQuote != null
                        ? formatMnt(b.finalQuote)
                        : `${formatMnt(b.estimateMin)} – ${formatMnt(b.estimateMax)}`}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusSelect action={setBriefStatus} id={b.id} value={b.status} options={STATUS} />
                  <DeleteButton action={deleteBrief} id={b.id} />
                </div>
              </div>

              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                {b.services.length > 0 && (
                  <div className="sm:col-span-2"><span className="text-muted-foreground">Үйлчилгээ:</span> {b.services.join(", ")}</div>
                )}
                {b.about && <div><span className="text-muted-foreground">Танилцуулга:</span> {b.about}</div>}
                {b.goal && <div><span className="text-muted-foreground">Гол зорилго:</span> {b.goal}</div>}
                {b.pages.length > 0 && (
                  <div><span className="text-muted-foreground">Хуудаснууд:</span> {b.pages.join(", ")}</div>
                )}
                {b.features.length > 0 && (
                  <div><span className="text-muted-foreground">Функцууд:</span> {b.features.join(", ")}</div>
                )}
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground sm:col-span-2">
                  <span>Домэйн: <span className="text-foreground">{b.domainStatus ?? "—"}{b.domainName ? ` (${b.domainName})` : ""}</span></span>
                  <span>Хостинг: <span className="text-foreground">{yn(b.hosting)}</span></span>
                  <span>Лого: <span className="text-foreground">{yn(b.hasLogo)}</span></span>
                  <span>Бүртгэл: <span className="text-foreground">{yn(b.needsAuth)}</span></span>
                  {b.timeline && <span>Хугацаа: <span className="text-foreground">{b.timeline}</span></span>}
                  {b.budget && <span>Төсөв: <span className="text-foreground">{b.budget}</span></span>}
                </div>
                {b.colors && <div className="sm:col-span-2"><span className="text-muted-foreground">Өнгө:</span> {b.colors}</div>}
                {b.references.length > 0 && (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">Лавлагаа:</span>{" "}
                    {b.references.map((r, i) => (
                      <a key={i} href={r} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                        {r}{i < b.references.length - 1 ? ", " : ""}
                      </a>
                    ))}
                  </div>
                )}
                {b.notes && <div className="sm:col-span-2"><span className="text-muted-foreground">Тэмдэглэл:</span> {b.notes}</div>}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatDate(b.createdAt)}</span>
                <Link href={`/admin/briefs/${b.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline">
                  Үнэлгээ / Хэвлэх <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
