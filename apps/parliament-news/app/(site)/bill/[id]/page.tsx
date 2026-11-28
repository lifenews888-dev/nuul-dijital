import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { billById } from "../../../../lib/bill-page";
import { BILL_STAGES, stageState, stageNote, voteShare } from "../../../../lib/reading";
import { mnNumericDate } from "../../../../lib/format";
import { coverUrl } from "../../../../lib/cover-input";

/**
 * `/bill/<id>` — хуулийн төслийн явц, өөрийн хаягтай.
 *
 * Явц нь нийтлэл дотор ч гардаг, гэхдээ тэр нь ТУХАЙН мэдээний хавсралт.
 * Хууль нь мэдээнээс урт насладаг: нэг төсөл олон сараар, олон мэдээгээр
 * явна. Иргэн «энэ хууль хаана явж байна» гэж хуваалцах хаягтай байх ёстой.
 */
export const revalidate = 300;

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const bill = await billById(params.id);
  if (!bill) return { title: "Хуулийн төсөл олдсонгүй" };
  return {
    title: bill.title,
    description: `${bill.title} — ${BILL_STAGES[bill.stage] ?? "явц"}.`,
    alternates: { canonical: `/bill/${bill.id}` },
  };
}

export default async function BillPage({ params }: Props) {
  const bill = await billById(params.id);
  if (!bill) notFound();

  const votes = voteShare(bill.votesYes, bill.votesNo);
  const hasVotes = bill.votesYes + bill.votesNo > 0;

  return (
    <article className="artpage">
      <div className="spread">
        <div className="pg L">
          <div className="dl">
            <div className="m">
              <span className="lbl dcat">ХУУЛИЙН ТӨСӨЛ</span>
            </div>

            <div className="m">
              <span>
                <h1 className="dt1">{bill.title}</h1>
              </span>
            </div>

            <div className="m">
              <span className="dmeta">
                {BILL_STAGES[bill.stage] ?? "Тодорхойгүй шат"} · шинэчлэгдсэн{" "}
                {mnNumericDate(bill.updatedAt)}
              </span>
            </div>

            <div className="m">
              <span>
                <div className="trk" role="list" aria-label="Хуулийн төслийн шатууд">
                  {BILL_STAGES.map((name, k) => (
                    <span
                      key={name}
                      role="listitem"
                      className={k < bill.stage ? "dn" : k === bill.stage ? "cu" : ""}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </span>
            </div>

            {BILL_STAGES.map((name, k) => {
              const step = bill.steps.find((s) => s.index === k);
              return (
                <div className="m" key={name}>
                  <span>
                    <div className="stgp">
                      <div className="sh">
                        <b>
                          {k + 1}. {name}
                        </b>
                        <span>
                          {stageState(k, bill.stage)}
                          {step?.date ? ` · ${mnNumericDate(step.date)}` : ""}
                        </span>
                      </div>
                      <p>{stageNote(k, bill.stage, step?.note ?? null)}</p>
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
                  </span>
                </div>
              );
            })}

            {hasVotes ? (
              <div className="m">
                <span>
                  <div className="vt">
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
                </span>
              </div>
            ) : null}

            {bill.post ? (
              <div className="m">
                <span className="nx">
                  <div className="nxh">Холбогдох мэдээ →</div>
                  <Link className="nxb big" href={`/news/${bill.post.slug}`}>
                    <i>
                      <img src={coverUrl(bill.post.slug)} alt="" width={474} height={620} loading="lazy" />
                    </i>
                    <span>
                      <b>{bill.post.title}</b>
                    </span>
                  </Link>
                </span>
              </div>
            ) : null}

            <div className="m">
              <span className="note">
                Хуулийн албан ёсны эхийг{" "}
                <a href="https://legalinfo.mn" target="_blank" rel="noopener">
                  legalinfo.mn
                </a>
                -ээс үзнэ үү. Энэ хуудас нь Parliament News-ийн редакцын тэмдэглэл бөгөөд
                албан ёсны эх баримт биш.
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
