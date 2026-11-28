import type { Metadata } from "next";
import Link from "next/link";
import { requireStudio } from "../../../../lib/studio-session";
import { dashboardData } from "../../../../lib/dashboard";
import { greeting, CHART_RANGES, type ChartDays } from "../../../../lib/dashboard-chart";
import { STATUS_LABELS, STATUS_ORDER } from "../../../../lib/studio-status";
import { ROLE_LABELS, canCreate } from "../../../../lib/permissions";
import { mnDate } from "../../../../lib/format";
import { StatCard } from "../../../../components/studio/dashboard/stat-card";
import { ActivityChart } from "../../../../components/studio/dashboard/activity-chart";

export const metadata: Metadata = { title: "Самбар" };

/** УБ нь UTC+8 */
const UB_OFFSET_MS = 8 * 3_600_000;

function parseDays(raw: string | undefined): ChartDays {
  const n = Number(raw);
  const hit = CHART_RANGES.find((r) => r.days === n);
  return hit ? hit.days : 14;
}

/**
 * Редакцын самбар — нэвтэрмэгц гарах хуудас.
 *
 * Хоосон редакцад ч АМЬД харагдана: тоо бүр байрандаа, график завсаргүй,
 * юүлүүр бүтэн. «Өгөгдөл алга» гэсэн хоосон хуудас нь системийг
 * ажиллахгүй юм шиг харуулдаг.
 */
export default async function StudioDashboard({
  searchParams,
}: {
  searchParams: { chart?: string };
}) {
  const { actor, tenantId, name, email } = await requireStudio();
  const days = parseDays(searchParams.chart);
  const now = new Date();
  const d = await dashboardData(tenantId, actor.userId, days, now);

  const ubHour = new Date(now.getTime() + UB_OFFSET_MS).getUTCHours();
  const pending = d.counts.REVIEW + d.counts.APPROVED;
  const delta = d.week.before === 0 ? null : Math.round(((d.week.now - d.week.before) / d.week.before) * 100);

  return (
    <>
      {/* Мэндчилгээ — admin.html-ийн хөх хайрцаг */}
      <section className="mb-4 flex flex-wrap items-center gap-4 rounded-[14px] bg-rail px-5 py-5 text-white md:px-6">
        <div className="min-w-0">
          <span className="block font-head text-[13px] text-white/70">{greeting(ubHour)}</span>
          <h1 className="mt-0.5 font-head text-[22px] font-bold leading-tight md:text-[26px]">
            {mnDate(now)}
          </h1>
          <p className="mt-1 font-head text-[13px] text-white/70">
            {name ?? email} · {ROLE_LABELS[actor.role].name} · {d.counts.PUBLISHED} нийтлэгдсэн ·{" "}
            {pending} хүлээгдэж буй
          </p>
        </div>

        <div className="ml-auto flex flex-wrap gap-2">
          {canCreate(actor) ? (
            <Link
              href="/studio/news/new"
              className="flex h-10 items-center rounded-lg bg-white px-4 font-head text-sm font-bold text-rail"
            >
              Шинэ мэдээ
            </Link>
          ) : null}
          <Link
            href="/"
            className="flex h-10 items-center rounded-lg border border-white/25 px-4 font-head text-sm font-semibold text-white"
          >
            Сайт үзэх ↗
          </Link>
        </div>
      </section>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Нийтлэгдсэн"
          value={d.counts.PUBLISHED}
          note={`${d.week.now} нь энэ 7 хоногт`}
          href="/studio/news?status=PUBLISHED"
          accent="cob"
        />
        <StatCard
          label="Энэ 7 хоног"
          value={d.week.now}
          note={
            delta === null
              ? "өмнөх 7 хоногт нийтлэл алга"
              : `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)}% өмнөх 7 хоногоос`
          }
          accent="ok"
        />
        <StatCard
          label="Хүлээгдэж буй"
          value={pending}
          note={`Хянах ${d.counts.REVIEW} · Нийтлэх ${d.counts.APPROVED}`}
          href="/studio/news?status=REVIEW"
          accent="warn"
        />
        <StatCard
          label="Ноорог"
          value={d.counts.DRAFT}
          note={`Буцаасан ${d.counts.RETURNED}`}
          href="/studio/news?status=DRAFT"
        />
        <StatCard
          label="Сэтгэгдэл"
          value={d.comments.total}
          note={`+${d.comments.today} өнөөдөр`}
          accent="red"
        />
        <StatCard
          label="Медиа"
          value={d.media.total}
          note={`Видео ${d.media.videos}`}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          {/* Миний ажил — хамгийн түрүүнд: редактор эхлээд ӨӨРИЙНХӨӨ ажлыг хайна */}
          <section className="rounded-[14px] border border-line bg-pan p-4 md:p-5">
            <h2 className="mb-3 font-head text-[15px] font-bold text-ink">Миний ажил</h2>
            {d.mine.length === 0 ? (
              <p className="font-head text-[13px] text-muted">
                Гарт байгаа мэдээ алга. {canCreate(actor) ? "Шинэ мэдээ эхлүүлж болно." : ""}
              </p>
            ) : (
              <ul className="m-0 list-none p-0">
                {d.mine.map((p) => (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-center gap-2 border-t border-line py-2 first:border-t-0 first:pt-0"
                  >
                    <span data-status={p.status}>{STATUS_LABELS[p.status]}</span>
                    <Link
                      href={`/studio/news/${p.id}`}
                      className="min-w-0 flex-1 truncate font-head text-[13.5px] font-semibold text-ink hover:underline"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <ActivityChart points={d.chart} days={days} />

          {/* Ажлын урсгалын юүлүүр */}
          <section className="rounded-[14px] border border-line bg-pan p-4 md:p-5">
            <div className="mb-3 flex flex-wrap items-baseline gap-2">
              <h2 className="font-head text-[15px] font-bold text-ink">Ажлын урсгал</h2>
              <span className="ml-auto font-head text-[12.5px] text-muted">
                Ноорогоос нийтлэл хүртэл
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
              {STATUS_ORDER.map((s) => (
                <Link
                  key={s}
                  href={`/studio/news?status=${s}`}
                  className="rounded-lg border border-line bg-inp px-3 py-2.5 hover:border-cob"
                >
                  <span className="flex items-baseline gap-2">
                    <span className="font-head text-[12.5px] font-semibold text-muted">
                      {STATUS_LABELS[s]}
                    </span>
                    <b className="ml-auto font-head text-[18px] font-bold tabular-nums text-ink">
                      {d.counts[s]}
                    </b>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Чанарын шалгалт */}
          <section className="rounded-[14px] border border-line bg-pan p-4 md:p-5">
            <h2 className="mb-3 font-head text-[15px] font-bold text-ink">Чанарын шалгалт</h2>
            {d.issues.length === 0 ? (
              <p className="font-head text-[13px] text-muted">
                Батлагдсан ба нийтлэгдсэн мэдээ бүр бүрэн байна.
              </p>
            ) : (
              <ul className="m-0 list-none p-0">
                {d.issues.map((i) => (
                  <li key={i.id} className="border-t border-line py-2 first:border-t-0 first:pt-0">
                    <Link
                      href={`/studio/news/${i.id}`}
                      className="font-head text-[13.5px] font-semibold text-ink hover:underline"
                    >
                      {i.title}
                    </Link>
                    <span className="mt-0.5 block font-head text-[12.5px] text-warn">
                      Дутуу: {i.missing.join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4">
          {/* Сайтын төлөв */}
          <section className="rounded-[14px] border border-line bg-pan p-4 md:p-5">
            <h2 className="mb-3 font-head text-[15px] font-bold text-ink">Сайтын төлөв</h2>
            {d.live ? (
              <dl className="m-0">
                <StatusRow label="Шууд дамжуулалт" on={d.live.liveOn} />
                <StatusRow label="Яаралтай мэдээ" on={d.live.breakingOn} />
                <StatusRow label="«ШУУД» гүйдэг мөр" on={d.live.tickerOn} />
                <div className="border-t border-line pt-2.5">
                  <dt className="font-head text-[13px] font-semibold text-ink">
                    {d.live.sessionStatus}
                  </dt>
                  <dd className="m-0 font-head text-[12.5px] text-muted">
                    Ирц {d.live.attendance} / 126
                  </dd>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
                    <span
                      className="block h-full rounded-full bg-cob"
                      style={{ width: `${Math.min(100, (d.live.attendance / 126) * 100)}%` }}
                    />
                  </div>
                </div>
              </dl>
            ) : (
              <p className="font-head text-[13px] text-muted">Төлөв тохируулаагүй байна.</p>
            )}
            <p className="mt-3 font-head text-[12px] text-muted">
              Шууд, яаралтай мөрийг супер админ, ерөнхий редактор, шууд дамжуулалтын ажилтан
              удирдана.
            </p>
          </section>

          {/* Өнөөдрийн чуулган */}
          <section className="rounded-[14px] border border-line bg-pan p-4 md:p-5">
            <h2 className="mb-3 font-head text-[15px] font-bold text-ink">Өнөөдрийн чуулган</h2>
            {d.agenda.length === 0 ? (
              <p className="font-head text-[13px] text-muted">Өнөөдрийн хөтөлбөр оруулаагүй.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {d.agenda.map((a) => (
                  <li
                    key={`${a.time}-${a.text}`}
                    className="grid grid-cols-[48px_minmax(0,1fr)] gap-2 border-t border-line py-2 font-head text-[13px] first:border-t-0 first:pt-0"
                  >
                    <b className="tabular-nums text-cob">{a.time}</b>
                    <span className="text-ink">{a.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Сүүлийн сэтгэгдэл — нуугдсан нь эхэнд, тэд анхаарал шаардана */}
          <section className="rounded-[14px] border border-line bg-pan p-4 md:p-5">
            <div className="mb-3 flex items-baseline gap-2">
              <h2 className="font-head text-[15px] font-bold text-ink">Сүүлийн сэтгэгдэл</h2>
              <Link
                href="/studio/comments"
                className="ml-auto font-head text-[12.5px] font-semibold text-cob"
              >
                Бүгд →
              </Link>
            </div>
            {d.comments_recent.length === 0 ? (
              <p className="font-head text-[13px] text-muted">Сэтгэгдэл алга.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {d.comments_recent.map((c) => (
                  <li key={c.id} className="border-t border-line py-2 first:border-t-0 first:pt-0">
                    <b className="font-head text-[12.5px] font-semibold text-ink">
                      {c.authorName}
                    </b>
                    {c.hidden ? (
                      <span className="ml-1.5 font-head text-[11.5px] text-warn">нуугдсан</span>
                    ) : null}
                    <p className="mt-0.5 line-clamp-2 font-body text-[13px] text-muted">{c.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Ангиллаар */}
          <section className="rounded-[14px] border border-line bg-pan p-4 md:p-5">
            <h2 className="mb-3 font-head text-[15px] font-bold text-ink">Ангиллаар</h2>
            {d.byCategory.length === 0 ? (
              <p className="font-head text-[13px] text-muted">Мэдээ алга.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {d.byCategory.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-baseline gap-2 border-t border-line py-1.5 font-head text-[13px] first:border-t-0 first:pt-0"
                  >
                    <span className="truncate text-ink">{c.name}</span>
                    <b className="ml-auto tabular-nums text-muted">{c.count}</b>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Багийн идэвх */}
          <section className="rounded-[14px] border border-line bg-pan p-4 md:p-5">
            <h2 className="mb-3 font-head text-[15px] font-bold text-ink">
              Багийн идэвх
              <small className="ml-2 font-medium text-muted">7 хоног</small>
            </h2>
            {d.team.length === 0 ? (
              <p className="font-head text-[13px] text-muted">Идэвх алга.</p>
            ) : (
              <ul className="m-0 list-none p-0">
                {d.team.map((t) => (
                  <li
                    key={t.name}
                    className="flex items-baseline gap-2 border-t border-line py-1.5 font-head text-[13px] first:border-t-0 first:pt-0"
                  >
                    <span className="truncate text-ink">{t.name}</span>
                    <b className="ml-auto tabular-nums text-muted">{t.actions}</b>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Сошиал сувгууд */}
          <section className="rounded-[14px] border border-line bg-pan p-4 md:p-5">
            <h2 className="mb-3 font-head text-[15px] font-bold text-ink">
              Сошиал сувгууд
              <small className="ml-2 font-medium text-muted">нийтлэгдсэн мэдээ</small>
            </h2>
            <ul className="m-0 list-none p-0">
              {d.channels.map((c) => (
                <li
                  key={c.name}
                  className="flex items-baseline gap-2 rounded-md bg-inp px-2.5 py-1.5 font-head text-[13px] [&+li]:mt-1"
                >
                  <span className="text-ink">{c.name}</span>
                  <b className="ml-auto tabular-nums text-muted">{c.count}</b>
                </li>
              ))}
            </ul>

            {/*
              Автомат нийтлэлийн дараалал. «Алдаа» л анхаарал шаардана;
              «тохируулаагүй» нь холболт хийгдээгүй гэсэн үг, засах зүйл
              нь код биш, Vercel дээрх токен.
            */}
            <div className="mt-3 border-t border-line pt-3">
              <div className="mb-1.5 font-head text-[12px] font-semibold text-muted">
                Автомат нийтлэл
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-head text-[12.5px]">
                <span className="text-muted">
                  Хүлээгдэж буй <b className="text-ink tabular-nums">{d.socialQueue.queued}</b>
                </span>
                <span className="text-muted">
                  Илгээсэн <b className="text-ink tabular-nums">{d.socialQueue.sent}</b>
                </span>
                <span className={d.socialQueue.failed > 0 ? "text-[#c0392b]" : "text-muted"}>
                  Алдаа <b className="tabular-nums">{d.socialQueue.failed}</b>
                </span>
                <span className="text-muted">
                  Тохируулаагүй <b className="text-ink tabular-nums">{d.socialQueue.skipped}</b>
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

/** Унтраалгын төлөв — ЗӨВХӨН харуулна, засах нь тохиргооны хуудсанд */
function StatusRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center gap-2 border-b border-line py-2.5 first:pt-0">
      <div>
        <dt className="font-head text-[13px] font-semibold text-ink">{label}</dt>
        <dd className="m-0 font-head text-[12.5px] text-muted">
          {on ? "Асаалттай" : "Унтраалттай"}
        </dd>
      </div>
      <span
        className={
          "ml-auto flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 " +
          (on ? "bg-ok justify-end" : "bg-line justify-start")
        }
        aria-hidden="true"
      >
        <i className="block h-4 w-4 rounded-full bg-white" />
      </span>
    </div>
  );
}
