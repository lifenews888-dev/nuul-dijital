"use client";

import { useState } from "react";
import { BILL_STAGES, stageState, stageNote, voteShare } from "../../lib/reading";
import { mnNumericDate } from "../../lib/format";
import type { BillView } from "../../lib/article-view";

/**
 * Хуулийн төслийн явц — artifact-ийн `dPol()` ба `stgHtml()`.
 *
 * Таван нүд нь ҮРГЭЛЖ зурагдана, редакц зөвхөн заримыг нь бичсэн ч: уншигч
 * хуулийн зам хаанаас хаашаа явдгийг бүтнээр харах ёстой. Бичигдээгүй шат
 * нь "хараахан эхлээгүй" эсвэл "мэдээлэл ороогүй" — `stageNote` ялгана.
 */
export function BillTrack({ bill }: { bill: BillView }) {
  const [picked, setPicked] = useState(bill.stage);
  const step = bill.steps.find((s) => s.index === picked);
  const votes = voteShare(bill.votesYes, bill.votesNo);
  const hasVotes = bill.votesYes + bill.votesNo > 0;

  return (
    <div>
      <div className="lbl" style={{ color: "#6D6A63", marginBottom: 8 }}>
        Хуулийн төслийн явц{" "}
        <span style={{ fontWeight: 500, letterSpacing: 0 }}>— шат бүр дээр дарж уншина</span>
      </div>

      <div className="trk" role="tablist" aria-label="Хуулийн төслийн шатууд">
        {BILL_STAGES.map((name, k) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={k === picked}
            className={`${k < bill.stage ? "dn" : k === bill.stage ? "cu" : ""}${k === picked ? " sel" : ""}`}
            onClick={() => setPicked(k)}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="stgp">
        <div className="sh">
          <b>
            {picked + 1}. {BILL_STAGES[picked]}
          </b>
          <span>
            {stageState(picked, bill.stage)}
            {step?.date ? ` · ${mnNumericDate(step.date)}` : ""}
          </span>
        </div>
        <p>{stageNote(picked, bill.stage, step?.note ?? null)}</p>
        {step && step.sources.length > 0 ? (
          <ul className="alk">
            {step.sources.map((u) => (
              <li key={u}>
                <a href={u} target="_blank" rel="noopener">
                  {u.replace(/^https?:\/\//, "").slice(0, 60)} ↗
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {hasVotes ? (
        <div className="vt" style={{ marginTop: 14 }}>
          <div className="vb">
            <span style={{ width: `${votes.yesPct}%` }} />
            <span style={{ width: `${votes.noPct}%` }} />
          </div>
          <div className="vl">
            <span>
              Дэмжсэн <b>{bill.votesYes}</b>
            </span>
            <span>
              Татгалзсан <b>{bill.votesNo}</b>
            </span>
            <span>{votes.support}% дэмжлэг</span>
          </div>
        </div>
      ) : null}

      <a
        className="src"
        href="https://legalinfo.mn"
        target="_blank"
        rel="noopener"
        style={{ display: "inline-block", marginTop: 12, fontSize: 13, fontWeight: 600 }}
      >
        Хуулийн албан ёсны эх — legalinfo.mn ↗
      </a>
    </div>
  );
}
