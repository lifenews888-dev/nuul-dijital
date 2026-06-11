import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser, safe } from "@/lib/admin";
import { estimateBrief, formatMnt } from "@/lib/estimate";
import { siteConfig } from "@/lib/site";
import { LogoMark } from "@/components/shared/logo";
import { PrintBar } from "@/components/admin/print-bar";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BriefPrintPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const b = await safe(() => db.projectBrief.findUnique({ where: { id } }), null);
  if (!b) notFound();

  const est = estimateBrief(b);
  const ref = `NUUL-${b.id.slice(-6).toUpperCase()}`;
  const hasFinal = b.finalQuote != null;

  return (
    <div className="print-doc mx-auto my-6 max-w-[820px] bg-white p-10 text-zinc-900 shadow-2xl print:my-0 print:max-w-none print:p-0 print:shadow-none">
      {/* Letterhead */}
      <div className="flex items-start justify-between border-b border-zinc-200 pb-6">
        <div className="flex items-center gap-3">
          <LogoMark size={48} />
          <div>
            <div className="text-xl font-extrabold tracking-tight text-zinc-900">
              {siteConfig.name}
            </div>
            <div className="text-xs text-zinc-500">{siteConfig.tagline}</div>
          </div>
        </div>
        <div className="text-right text-xs leading-relaxed text-zinc-600">
          <div>{siteConfig.address}</div>
          <div>{siteConfig.phone}</div>
          <div>{siteConfig.email}</div>
          <div>nuul.digital</div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">ҮНИЙН САНАЛ</h1>
          <div className="mt-1 text-sm text-zinc-500">Дугаар: {ref}</div>
        </div>
        <div className="text-right text-sm text-zinc-500">
          <div>Огноо: {formatDate(new Date())}</div>
          <div>Хүчинтэй хугацаа: 14 хоног</div>
        </div>
      </div>

      {/* Recipient */}
      <div className="mt-8 grid grid-cols-2 gap-6">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Хүлээн авагч</div>
          <div className="mt-1 font-semibold text-zinc-900">{b.name}</div>
          {b.company && <div className="text-sm text-zinc-600">{b.company}</div>}
          <div className="text-sm text-zinc-600">{b.email}</div>
          <div className="text-sm text-zinc-600">{b.phone}</div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Төслийн төрөл</div>
          <div className="mt-1 text-sm text-zinc-700">
            {[...b.projectTypes, ...b.services].filter(Boolean).join(", ") || "Вэб шийдэл"}
          </div>
        </div>
      </div>

      {/* Items */}
      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
            <th className="py-2">Ажлын төрөл</th>
            <th className="py-2 text-right">Үнэлгээ (₮)</th>
          </tr>
        </thead>
        <tbody>
          {est.items.map((it, i) => (
            <tr key={i} className="border-b border-zinc-100">
              <td className="py-2 text-zinc-700">{it.label}</td>
              <td className="py-2 text-right text-zinc-700">
                {formatMnt(it.min)} – {formatMnt(it.max)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Total */}
      <div className="mt-6 flex justify-end">
        <div className="w-72 rounded-lg bg-zinc-50 p-4">
          <div className="flex items-center justify-between text-sm text-zinc-500">
            <span>Урьдчилсан дүн</span>
            <span>{formatMnt(est.min)} – {formatMnt(est.max)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-zinc-200 pt-2">
            <span className="font-semibold text-zinc-900">Эцсийн үнэлгээ</span>
            <span className="text-lg font-extrabold text-zinc-900">
              {hasFinal ? formatMnt(b.finalQuote) : `${formatMnt(est.min)} – ${formatMnt(est.max)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Note */}
      {b.quoteNote && (
        <div className="mt-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Тэмдэглэл</div>
          <p className="mt-1 whitespace-pre-line text-sm text-zinc-700">{b.quoteNote}</p>
        </div>
      )}
      {b.meetingAt && (
        <p className="mt-4 text-sm text-zinc-700">
          <strong>Уулзалтын товлосон цаг:</strong> {b.meetingAt}
        </p>
      )}

      {/* Footer */}
      <div className="mt-12 flex items-end justify-between border-t border-zinc-200 pt-6">
        <div className="text-xs text-zinc-500">
          <p>Энэхүү үнийн санал нь урьдчилсан тооцоо бөгөөд эцсийн гэрээгээр баталгаажна.</p>
          <p className="mt-1">Хүндэтгэсэн, {siteConfig.name}</p>
        </div>
        <div className="text-center">
          <div className="h-12 w-48 border-b border-zinc-400" />
          <div className="mt-1 text-xs text-zinc-500">Гарын үсэг / тамга</div>
        </div>
      </div>

      <PrintBar />
    </div>
  );
}
