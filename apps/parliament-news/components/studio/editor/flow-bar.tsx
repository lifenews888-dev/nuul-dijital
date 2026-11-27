import type { NewsStatus } from "@nuul/db-news";
import { FLOW } from "../../../lib/permissions";

/**
 * Урсгалын мөр — admin.html-ийн `#flow` (:991).
 *
 * Дөрвөн шат, одоогийнх нь тодорсон. «Буцаасан» нь шат БИШ, хажуугийн
 * сум тул мөрийн төгсгөлд тусад нь гарна — урсгалын дунд байрлуулбал
 * «буцаалт бол дараагийн алхам» гэсэн буруу ойлголт өгнө.
 */
export function FlowBar({ status, reviewNote }: { status: NewsStatus; reviewNote: string | null }) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center gap-1.5 font-head text-[13px]">
        {FLOW.map((step, i) => (
          <span key={step.status} className="flex items-center gap-1.5">
            {i > 0 ? <b className="font-normal text-muted">→</b> : null}
            <span
              data-status={step.status === status ? step.status : undefined}
              className={
                step.status === status
                  ? ""
                  : "rounded-full px-[9px] py-[5px] text-[11.5px] font-semibold text-muted"
              }
            >
              {step.label}
            </span>
          </span>
        ))}

        {status === "RETURNED" ? (
          <span data-status="RETURNED" className="ml-1.5">
            ↩ Буцаасан
          </span>
        ) : null}
      </div>

      {/*
        Хянагчийн тайлбар нь урсгалын мөрийн ЯГ ДООР: сэтгүүлч юу
        засахаа мэдэхгүй бол буцаалт нь зүгээр нэг саатал болно.
      */}
      {status === "RETURNED" && reviewNote ? (
        <p className="mt-2.5 rounded-lg border-l-[3px] border-[#c0392b] bg-pan px-3 py-2.5 font-head text-[13px] text-ink">
          <b className="mb-0.5 block text-[12px] font-bold text-[#c0392b]">Хянагчийн тайлбар</b>
          {reviewNote}
        </p>
      ) : null}
    </div>
  );
}
