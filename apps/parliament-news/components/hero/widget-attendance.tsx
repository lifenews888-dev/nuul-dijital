import { hemicycleDots, SEATS } from "../../lib/hemicycle";
import type { LiveInfo } from "../../lib/home-data";

/**
 * Ирцийн виджет — artifact-ийн `aside.wg.wl` (index.html:588).
 *
 * Хагас дугуй нь `drawHemi()`-ийн яг тооцоо, зөвхөн серверт зурагдана:
 * 126 цэг нь өөрчлөгдөхгүй тул client талд JS шаардахгүй.
 */
export function WidgetAttendance({ live }: { live: LiveInfo | null }) {
  if (!live) return null;
  const dots = hemicycleDots(live.attendance);

  return (
    <aside className="wg wl" aria-label="Нэгдсэн хуралдаан">
      <svg viewBox="0 0 220 116" id="hemi" aria-hidden="true">
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.cx}
            cy={d.cy}
            r="3.6"
            fill={d.filled ? "currentColor" : "none"}
            stroke={d.filled ? undefined : "currentColor"}
            strokeWidth={d.filled ? undefined : 1}
          />
        ))}
        {/* Илтгэгчийн ширээ */}
        <rect x="98" y="100" width="24" height="12" rx="1" fill="var(--red)" />
      </svg>
      <div className="lbl wk">УИХ · Нэгдсэн хуралдаан</div>
      <div className="big">
        <span id="att">{live.attendance}</span>
        <small> / {SEATS} ирц</small>
      </div>
      <div className="lbl on" id="sst">
        {live.sessionStatus}
      </div>
    </aside>
  );
}
