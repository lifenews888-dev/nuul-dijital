import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer, Mail, Calculator, Check } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { saveQuote, sendQuoteEmail, setBriefStatus, deleteBrief } from "@/app/admin/actions";
import { estimateBrief, formatMnt } from "@/lib/estimate";
import { AdminHeader } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { StatusSelect } from "@/components/admin/status-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  if (children == null || children === "" || (Array.isArray(children) && children.length === 0)) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}

export default async function BriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const b = await safe(() => db.projectBrief.findUnique({ where: { id } }), null);
  if (!b) notFound();

  const est = estimateBrief(b);

  return (
    <div className="max-w-4xl">
      <Link href="/admin/briefs" className="mb-4 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
        <ArrowLeft className="size-4" /> Бүх хүсэлт
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{b.name}</h1>
            {b.projectTypes.map((t) => <Badge key={t} variant="accent">{t}</Badge>)}
            {b.quoteSentAt && <Badge variant="cyan">Илгээсэн</Badge>}
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {b.email} · {b.phone}{b.company ? ` · ${b.company}` : ""}{b.location ? ` · ${b.location}` : ""}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{formatDate(b.createdAt)}</div>
        </div>
        <div className="flex items-center gap-2">
          <StatusSelect action={setBriefStatus} id={b.id} value={b.status} options={STATUS} />
          <DeleteButton action={deleteBrief} id={b.id} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Brief details */}
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Брифийн мэдээлэл</h2>
          <div className="flex flex-col gap-4">
            <Field label="Үйлчилгээ">{b.services.join(", ")}</Field>
            <Field label="Танилцуулга">{b.about}</Field>
            <Field label="Гол зорилго">{b.goal}</Field>
            <Field label="Хуудаснууд">{b.pages.join(", ")}</Field>
            <Field label="Функцууд">{b.features.join(", ")}</Field>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span>Домэйн: <span className="text-foreground">{b.domainStatus ?? "—"}{b.domainName ? ` (${b.domainName})` : ""}</span></span>
              <span>Хостинг: <span className="text-foreground">{yn(b.hosting)}</span></span>
              <span>Лого: <span className="text-foreground">{yn(b.hasLogo)}</span></span>
              <span>Бүртгэл: <span className="text-foreground">{yn(b.needsAuth)}</span></span>
            </div>
            <Field label="Өнгө">{b.colors}</Field>
            <Field label="Хугацаа / Төсөв">{[b.timeline, b.budget].filter(Boolean).join(" · ")}</Field>
            {b.references.length > 0 && (
              <Field label="Лавлагаа">
                {b.references.map((r, i) => (
                  <a key={i} href={r} target="_blank" rel="noreferrer" className="mr-2 text-accent hover:underline">{r}</a>
                ))}
              </Field>
            )}
            <Field label="Тэмдэглэл">{b.notes}</Field>
          </div>
        </div>

        {/* Estimate + quote */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Calculator className="size-5 text-accent" /> Автомат урьдчилсан үнэлгээ
            </h2>
            <div className="text-2xl font-bold text-accent-cyan">
              {formatMnt(est.min)} <span className="text-muted-foreground">–</span> {formatMnt(est.max)}
            </div>
            <div className="mt-4 divide-y divide-white/5 text-sm">
              {est.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">{it.label}</span>
                  <span>{formatMnt(it.min)} – {formatMnt(it.max)}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              * Энэ нь системийн автомат тооцоолол. Доор эцсийн үнэлгээгээ баталгаажуулна уу.
            </p>
          </div>

          {/* Final quote form */}
          <form action={saveQuote} className="rounded-2xl border border-white/10 bg-card p-6">
            <input type="hidden" name="id" value={b.id} />
            <h2 className="mb-4 text-lg font-semibold">Эцсийн үнэлгээ ба уулзалт</h2>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Эцсийн дүн (₮)</span>
                <Input name="finalQuote" defaultValue={b.finalQuote ?? ""} placeholder={`${est.min} - ${est.max}`} inputMode="numeric" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Тэмдэглэл (харилцагчид харагдана)</span>
                <Textarea name="quoteNote" defaultValue={b.quoteNote ?? ""} rows={3} placeholder="Үнэлгээний тайлбар, хамрах хүрээ..." />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium">Уулзалтын өдөр / цаг</span>
                <Input name="meetingAt" defaultValue={b.meetingAt ?? ""} placeholder="Жишээ: 6/5, 14:00 цаг" />
              </label>
              <Button type="submit" variant="default" className="self-start">
                <Check className="size-4" /> Хадгалах / Батлах
              </Button>
            </div>
          </form>

          {/* Actions */}
          <div className="rounded-2xl border border-white/10 bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold">Үйлдэл</h2>
            {b.quoteSentAt && (
              <p className="mb-3 text-sm text-accent-cyan">✓ Имэйл илгээгдсэн: {formatDate(b.quoteSentAt)}</p>
            )}
            <div className="flex flex-wrap gap-3">
              <form action={sendQuoteEmail}>
                <input type="hidden" name="id" value={b.id} />
                <Button type="submit" variant="gradient">
                  <Mail className="size-4" /> Харилцагч руу имэйлээр илгээх
                </Button>
              </form>
              <Button asChild variant="outline">
                <Link href={`/admin/briefs/${b.id}/print`} target="_blank">
                  <Printer className="size-4" /> Албан ёсны баримт хэвлэх
                </Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Имэйл илгээхээс өмнө эцсийн дүнгээ хадгална уу. Дүн оруулаагүй бол урьдчилсан хязгаар илгээгдэнэ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
