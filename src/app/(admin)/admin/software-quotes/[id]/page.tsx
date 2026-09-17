import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/admin";
import {
  sendSoftwareQuoteReply,
  setSoftwareQuoteStatus,
  deleteSoftwareQuote,
} from "@/app/(admin)/admin/actions";
import { AdminHeader } from "@/components/admin/ui";
import { DeleteButton } from "@/components/admin/delete-button";
import { StatusSelect } from "@/components/admin/status-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { siteConfig } from "@/lib/site";
import { getCompanyProfile, isProfileComplete } from "@/lib/company-profile";

export const dynamic = "force-dynamic";

const STATUS = [
  { value: "NEW", label: "Шинэ" },
  { value: "CONTACTED", label: "Холбогдсон" },
  { value: "QUALIFIED", label: "Шалгарсан" },
  { value: "WON", label: "Хожсон" },
  { value: "LOST", label: "Алдсан" },
];

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 whitespace-pre-line">{value}</div>
    </div>
  );
}

export default async function SoftwareQuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const q = await db.softwareQuote.findUnique({ where: { id } });
  if (!q) notFound();

  // Read at render so the page can say plainly whether pressing send will do
  // anything, instead of letting an admin find out by getting no reply.
  const mailConfigured = Boolean(process.env.RESEND_API_KEY);

  // A corporate buyer checks who is quoting before what it costs, so surface a
  // missing legal identity here rather than letting it go out incomplete.
  const company = await getCompanyProfile();
  const profileComplete = isProfileComplete(company);
  const ref = `NUUL-SW-${q.id.slice(-6).toUpperCase()}`;
  const validUntil = new Date(Date.now() + company.quoteValidDays * 86_400_000)
    .toISOString()
    .slice(0, 10);

  const draft = [
    `Танай "${q.company}" байгууллагаас ирүүлсэн ${q.vendor ?? "программ хангамжийн"} лицензийн хүсэлтэд баярлалаа.`,
    ``,
    `Хүсэлтийн дагуу дараах үнийн саналыг хүргүүлж байна:`,
    ``,
    `[Бүтээгдэхүүн / лицензийн төрөл]`,
    `[Хугацаа: ${q.term ?? "—"}]`,
    `[Хэрэглэгчийн тоо: ${q.seats ?? "—"}]`,
    `[Нийт үнэ: ₮]`,
    ``,
    `Үнийн санал ... хүртэл хүчинтэй. Асуух зүйл байвал энэ имэйлд хариулах эсвэл ${siteConfig.phone} дугаараар холбогдоорой.`,
  ].join("\n");

  return (
    <div>
      <Link
        href="/admin/software-quotes"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Бүх лицензийн хүсэлт
      </Link>

      <AdminHeader title={q.company} description={`Хүсэлт ирсэн: ${formatDate(q.createdAt)}`} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusSelect
          action={setSoftwareQuoteStatus}
          id={q.id}
          value={q.status}
          options={STATUS}
        />
        <DeleteButton action={deleteSoftwareQuote} id={q.id} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        {/* What they asked for */}
        <div className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-card p-6">
          <h2 className="text-lg font-semibold">Хүсэлтийн мэдээлэл</h2>
          <Field label="Байгууллага" value={q.company} />
          <Field label="ТТД" value={q.regNumber} />
          <Field label="Холбоо барих" value={q.contactName} />
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Имэйл</div>
            <a
              href={`mailto:${q.email}`}
              className="mt-1 block break-all text-accent hover:underline"
            >
              {q.email}
            </a>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Утас</div>
            <a href={`tel:${q.phone}`} className="mt-1 block hover:text-accent">
              {q.phone}
            </a>
          </div>
          {q.vendor && (
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Үйлдвэрлэгч
              </div>
              <Badge variant="accent" className="mt-1.5">
                {q.vendor}
              </Badge>
            </div>
          )}
          <Field label="Бүтээгдэхүүн" value={q.products} />
          <Field label="Хэрэглэгчийн тоо" value={q.seats ? String(q.seats) : null} />
          <Field label="Хугацаа" value={q.term} />
          <Field label="Нэмэлт тайлбар" value={q.message} />
        </div>

        {/* Reply */}
        <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-card p-6">
          <div>
            <h2 className="text-lg font-semibold">Хариу илгээх</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {q.email} хаяг руу {siteConfig.name} нэрээр илгээгдэнэ. Хариу нь{" "}
              {siteConfig.email} руу ирнэ.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
              <span>
                Үнийн санал №<span className="font-medium text-foreground">{ref}</span>
              </span>
              <span>
                Хүчинтэй: <span className="font-medium text-foreground">{validUntil}</span> хүртэл
              </span>
            </div>
          </div>

          {!mailConfigured && (
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
              <div>
                <div className="font-medium text-warning">Имэйл тохируулаагүй байна</div>
                <p className="mt-1 text-muted-foreground">
                  <code>RESEND_API_KEY</code> болон <code>CONTACT_FROM_EMAIL</code> орчны
                  хувьсагчийг тохируулах хүртэл энэ товч ажиллахгүй. Одоохондоо дээрх имэйл
                  хаяг дээр дарж өөрийн шуудангаар хариулна уу.
                </p>
              </div>
            </div>
          )}

          {!profileComplete && (
            <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning" />
              <div>
                <div className="font-medium text-warning">Компанийн хуулийн мэдээлэл дутуу</div>
                <p className="mt-1 text-muted-foreground">
                  Албан ёсны нэр, ТТД байхгүй бол үнийн саналын толгойд харагдахгүй.
                  Байгууллагын худалдан авагч үүнийг шалгадаг —{" "}
                  <Link href="/admin/settings" className="text-accent hover:underline">
                    Тохиргоо
                  </Link>{" "}
                  хэсгээс нөхөөрэй.
                </p>
              </div>
            </div>
          )}

          <form action={sendSoftwareQuoteReply} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={q.id} />
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Гарчиг</span>
              <Input
                name="subject"
                required
                defaultValue={`${q.vendor ?? "Программ хангамж"} лицензийн үнийн санал — ${siteConfig.name}`}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Захидал</span>
              {/* Prefilled from the enquiry so the reply starts from their own
                  numbers rather than a blank box. The bracketed lines are meant
                  to be replaced before sending. */}
              <Textarea name="body" required rows={14} defaultValue={draft} />
            </label>
            <Button type="submit" variant="gradient" disabled={!mailConfigured} className="self-start">
              <Mail className="size-4" /> Илгээх
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            Захидалд компанийн хуулийн мэдээлэл, үнийн саналын дугаар, хүчинтэй хугацаа,
            нийлүүлэлтийн нөхцөл, төлбөрийн данс автоматаар нэмэгдэнэ. Илгээсний дараа төлөв
            «Холбогдсон» болж, үйл ажиллагааны бүртгэлд тэмдэглэгдэнэ.
          </p>
        </div>
      </div>
    </div>
  );
}
