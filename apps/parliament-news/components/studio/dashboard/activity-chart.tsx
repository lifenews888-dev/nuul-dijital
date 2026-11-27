import Link from "next/link";
import { CHART_RANGES, chartMax, type ChartPoint } from "../../../lib/dashboard-chart";

/**
 * Нийтлэлийн идэвхийн график — admin.html-ийн самбарын гол блок.
 *
 * SVG биш, CSS багана: 90 багана нь хөтөчид хямд, scroll дээр
 * дахин зурагдахгүй, мөн хэвлэхэд ч зөв гарна. Хоосон өдөр нь тэг
 * өндөртэй багана болж үлдэнэ — завсар орвол амралтын өдөр ажилласан
 * мэт харагдана.
 */
export function ActivityChart({
  points,
  days,
}: {
  points: ChartPoint[];
  days: number;
}) {
  const max = chartMax(points);
  /** 90 хоногт шошго бүрийг багтаахгүй — долоо тутамд нэг */
  const step = days <= 14 ? 2 : days <= 30 ? 5 : 14;

  return (
    <section className="rounded-[14px] border border-line bg-pan p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-head text-[15px] font-bold text-ink">Нийтлэлийн идэвх</h2>
        <div className="ml-auto flex gap-1 rounded-lg border border-line bg-inp p-1">
          {CHART_RANGES.map((r) => (
            <Link
              key={r.days}
              href={`/studio?chart=${r.days}`}
              aria-current={r.days === days ? "page" : undefined}
              className={
                "h-7 rounded-md px-2.5 font-head text-[12.5px] font-semibold leading-7 " +
                (r.days === days ? "bg-cob text-white" : "text-muted hover:text-ink")
              }
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex h-[180px] items-end gap-[2px]" role="img" aria-label="Өдөр тутмын идэвх">
        {points.map((p) => {
          const total = p.published + p.other;
          return (
            <div
              key={p.day}
              className="flex min-w-0 flex-1 flex-col justify-end"
              title={`${p.day}: ${p.published} нийтэлсэн, ${p.other} бусад`}
            >
              {p.other > 0 ? (
                <span
                  className="block w-full rounded-t-[2px] bg-cob/25"
                  style={{ height: `${(p.other / max) * 160}px` }}
                />
              ) : null}
              {p.published > 0 ? (
                <span
                  className={"block w-full bg-cob " + (p.other > 0 ? "" : "rounded-t-[2px]")}
                  style={{ height: `${(p.published / max) * 160}px` }}
                />
              ) : null}
              {/* Тэг өдөр ч ул мөртэй — завсар орвол амралт ажилласан мэт */}
              {total === 0 ? <span className="block h-[2px] w-full bg-line" /> : null}
            </div>
          );
        })}
      </div>

      <div className="mt-1.5 flex gap-[2px]">
        {points.map((p, i) => (
          <span
            key={p.day}
            className="min-w-0 flex-1 text-center font-head text-[10px] tabular-nums text-muted"
          >
            {i % step === 0 ? p.day.slice(5).replace("-", "/") : ""}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 font-head text-[12px] text-muted">
        <span className="flex items-center gap-1.5">
          <i className="block h-2.5 w-2.5 rounded-[2px] bg-cob" /> Нийтэлсэн
        </span>
        <span className="flex items-center gap-1.5">
          <i className="block h-2.5 w-2.5 rounded-[2px] bg-cob/25" /> Засвар, бусад үйлдэл
        </span>
      </div>
    </section>
  );
}
