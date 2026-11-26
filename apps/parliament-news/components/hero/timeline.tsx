import { Fragment } from "react";
import { WEEK_TICKS, monthMarks } from "../../lib/timeline";

/**
 * Нүүрний доод талын жилийн шугам — artifact-ийн `buildTl()` (index.html:781).
 *
 * Серверийн компонент: 53 долоо хоногийн зураас, 12 сарын зураас, шошго ба
 * мэдээ бүрийн цэг нь өөрчлөгдөхгүй тул HTML-д шууд ирнэ. Зөвхөн хөдөлж
 * байгаа `#dot`-ийн байрлалыг `Shelf3D`-ийн кадрын давталт бичнэ.
 *
 * `aria-hidden`: шугам нь хараалын хэрэгсэл. `#hit` дээр дарж мэдээ солих нь
 * зөвхөн хулганд — гар, дэлгэц уншигчид тавиурын сум товч ба `.arr` товчнууд
 * ижил үйлдлийг хүртээмжтэйгээр өгнө.
 */
export function Timeline({ year, events }: { year: number; events: number[] }) {
  const pct = (f: number) => `${f * 100}%`;
  return (
    <div className="tl" id="tl" aria-hidden="true">
      <div className="ln" />
      <div id="tks">
        {Array.from({ length: WEEK_TICKS + 1 }, (_, w) => (
          <div
            className="tk"
            key={`w${w}`}
            style={{ left: pct(w / WEEK_TICKS), height: 7, opacity: 0.4 }}
          />
        ))}
        {monthMarks(year).map((m, i) => (
          <Fragment key={`m${i}`}>
            <div
              className="tk"
              style={{ left: pct(m.fraction), height: 13, opacity: 0.75 }}
            />
            <div
              className={`ty${i === 0 ? " first" : ""}${i % 2 ? " odd" : ""}`}
              style={{ left: pct(m.fraction) }}
            >
              {m.label}
            </div>
          </Fragment>
        ))}
        {events.map((f, i) => (
          <div className="ev" key={`e${i}`} style={{ left: pct(f) }} />
        ))}
      </div>
      <div className="dot" id="dot" />
      <div className="hit" id="hit" />
    </div>
  );
}
