import { mnDateTime } from "../../lib/format";
import { actionLabel } from "../../lib/activity-labels";
import type { ActivityRow } from "../../lib/activity-feed";

/**
 * Сүүлийн үйл явдал — admin.html-ийн `.log`.
 *
 * Редакц нь хүмүүсийн хоорондын гар дамжуулалт. «Хэн баталсан», «хэн
 * буулгасан» гэдэг хариулт байхгүй бол зөрчил гарахад хэн ч тайлбарлаж
 * чадахгүй.
 */
export function ActivityLog({ rows }: { rows: ActivityRow[] }) {
  return (
    <section
      aria-labelledby="activity-heading"
      className="rounded-[14px] border border-line bg-pan p-4"
    >
      <h2 id="activity-heading" className="mb-2 font-head text-[15px] font-bold text-ink">
        Сүүлийн үйл явдал
      </h2>

      {rows.length === 0 ? (
        <p className="font-head text-[13px] text-muted">Одоогоор түүх алга.</p>
      ) : (
        <ol className="m-0 list-none p-0">
          {rows.map((row) => (
            <li
              key={row.id}
              className="border-t border-line py-2 font-head text-[13px] first:border-t-0 first:pt-0"
            >
              <time
                dateTime={row.createdAt.toISOString()}
                className="block text-[12px] text-muted"
              >
                {mnDateTime(row.createdAt)}
              </time>
              <span className="text-ink">{actionLabel(row.action)}</span>
              {/* Нэр олдохгүй бол «Хэрэглэгч» — мөр хоосрохгүй */}
              <span className="text-muted"> · {row.userName ?? "Хэрэглэгч"}</span>
              {row.note ? (
                <span className="mt-0.5 block whitespace-pre-line text-ink">{row.note}</span>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
