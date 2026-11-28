import type { Metadata } from "next";
import Link from "next/link";
import { livePage } from "../../../lib/live-page";
import { mnDate, ubToday } from "../../../lib/format";
import { SEATS } from "../../../lib/hemicycle";
import { LiveBox } from "../../../components/hero/live-box";
import { PostCard } from "../../../components/post-card";

/**
 * `/live` — чуулганы шууд дамжуулалт.
 *
 * Нүүрэнд ч тоглуулагч байдаг ч өөрийн хаяг хэрэгтэй: чуулган явж байхад
 * хүмүүс «parlamentnews.mn/live» гэж хуваалцана, нүүрийг биш. Мөн
 * дамжуулалт байхгүй үед ч хуудас утгатай байх ёстой — өнөөдрийн хуваарь,
 * ирц, сүүлийн видео мэдээ.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Шууд дамжуулалт",
  description: "Улсын Их Хурлын нэгдсэн хуралдааны шууд дамжуулалт, өнөөдрийн хэлэлцэх асуудал.",
  alternates: { canonical: "/live" },
};

export default async function LivePage() {
  const { live, agenda, videos } = await livePage();
  const today = ubToday();
  const on = Boolean(live?.liveOn && live.liveUrl);

  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <h1 className="font-head text-3xl font-extrabold tracking-tight">Шууд дамжуулалт</h1>
      <p className="mt-1 font-head text-sm text-muted">
        {mnDate(today)}
        {live ? ` · ${live.sessionStatus}` : null}
      </p>

      {on ? (
        <div className="mt-6">
          <LiveBox live={live} />
        </div>
      ) : (
        <p className="mt-6 rounded-xl border border-rule/20 bg-sheet p-5 font-head text-sm text-muted">
          Одоогоор шууд дамжуулалт явагдаагүй байна. Хуралдаан эхлэхэд энэ хуудсанд
          гарна.
        </p>
      )}

      <section className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <h2 className="font-head text-xl font-bold">Өнөөдөр хэлэлцэх асуудал</h2>
          {agenda.length === 0 ? (
            <p className="mt-2 font-head text-sm text-muted">
              Өнөөдөр хуралдаан товлогдоогүй.
            </p>
          ) : (
            <ol className="mt-3 list-none space-y-2 p-0">
              {agenda.map((row, i) => (
                <li
                  key={`${row.time}-${i}`}
                  className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 border-t border-rule/15 py-2 first:border-t-0"
                >
                  <time className="font-head text-sm font-bold text-cob">{row.time}</time>
                  <span className="font-title text-[15px]">{row.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <aside className="rounded-xl border border-rule/20 bg-sheet p-4">
          <div className="font-head text-xs font-bold uppercase tracking-widest text-muted">
            УИХ · Нэгдсэн хуралдаан
          </div>
          <div className="mt-1 font-head text-4xl font-extrabold text-cob">
            {live?.attendance ?? 0}
            <span className="ml-1 text-base font-semibold text-muted">/ {SEATS} ирц</span>
          </div>
          <div className="mt-1 font-head text-sm text-muted">
            {live?.sessionStatus ?? "Мэдээлэл алга"}
          </div>
        </aside>
      </section>

      {videos.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-head text-xl font-bold">Видео мэдээ</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
          <Link href="/c/video" className="mt-4 inline-block font-head text-sm font-semibold text-cob">
            Бүх видео мэдээ →
          </Link>
        </section>
      ) : null}
    </div>
  );
}
