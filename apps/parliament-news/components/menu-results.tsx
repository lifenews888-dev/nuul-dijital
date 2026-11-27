"use client";

import { useMemo, useState } from "react";
import { Icon } from "./icon";
import {
  CHIP_LABELS,
  TIME_FILTERS,
  filterMenuPosts,
  menuChips,
  type ChipKey,
  type MenuPost,
  type TimeKey,
} from "../lib/menu-filter";
import { mnNumericDate } from "../lib/format";
import { BILL_STAGES } from "../lib/bill-stages";
import { plainCoverUrl } from "../lib/cover-input";

/**
 * Цэсний чип, хугацаа, илэрц — artifact-ийн `renderRes()` (index.html:952).
 *
 * Шүүлт нь ХӨТӨЧ ДЭЭР: сервер нь сүүлийн мэдээг нэг л удаа өгнө, бичих
 * болгонд хүсэлт явуулахгүй. Artifact-ийн мэдрэмж яг тийм — үсэг бүрт
 * жагсаалт шинэчлэгдэнэ.
 *
 * Урьдчилж татсанаас цааш хайвал «Бүх мэдээнээс хайх» нь `/search` руу
 * хөтөлнө: цэс нь архивт байгаа мэдээг «олдсонгүй» гэж ХУДАЛ хэлэхгүй.
 */
export function MenuResults({
  posts,
  order,
  onNavigate,
}: {
  posts: MenuPost[];
  order: string[];
  onNavigate: () => void;
}) {
  const [chip, setChip] = useState<ChipKey>("all");
  const [time, setTime] = useState<TimeKey>("all");
  const [q, setQ] = useState("");

  const chips = useMemo(() => menuChips(posts, order), [posts, order]);
  const list = useMemo(
    () => filterMenuPosts(posts, { chip, time, q }).slice().reverse(),
    [posts, chip, time, q],
  );

  const query = q.trim();

  return (
    <>
      <form className="sbox" action="/search" method="get" role="search">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          className="srch"
          id="q"
          name="q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Мэдээ хайх: төсөв, сонгууль, хороо…"
          autoComplete="off"
          aria-label="Мэдээ хайх"
        />
      </form>

      <div className="chips" id="chips">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            className={c.key === chip ? "chip on" : "chip"}
            aria-pressed={c.key === chip}
            onClick={() => setChip(c.key)}
          >
            <i>
              <Icon name={c.icon} />
            </i>
            <b>{CHIP_LABELS[c.key] ?? c.key}</b>
            <small>{c.count} мэдээ</small>
          </button>
        ))}
      </div>

      <div className="tflt" id="tflt" role="group" aria-label="Хугацаагаар шүүх">
        <span>Хугацаа</span>
        {TIME_FILTERS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={t.key === time ? "on" : undefined}
            aria-pressed={t.key === time}
            onClick={() => setTime(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rc" id="rc" aria-live="polite">
        {list.length} мэдээ
      </div>

      <div id="res">
        {list.length > 0 ? (
          list.map((p) => (
            <a className="ri" key={p.slug} href={`/news/${p.slug}`} onClick={onNavigate}>
              <i className="rcv">
                {/* Хавтас нь залхуу ачаалагдана — 60 зураг нэг дор татагдахгүй */}
                <img src={plainCoverUrl(p.slug)} alt="" loading="lazy" decoding="async" />
                {p.hasVideo ? (
                  <em>
                    <Icon name="play" />
                  </em>
                ) : null}
              </i>
              <span className="rtx">
                <span className="rmeta">
                  {p.category ? <span className="rcat">{p.category}</span> : null}
                  <span>{mnNumericDate(p.date)}</span>
                  {p.billStage !== null ? (
                    <span className={p.billStage === 4 ? "rst ok" : "rst"}>
                      {BILL_STAGES[p.billStage] ?? ""}
                    </span>
                  ) : null}
                </span>
                <b>{p.title}</b>
                {p.lead ? <p>{p.lead}</p> : null}
              </span>
              <span className="rgo" aria-hidden="true">
                ›
              </span>
            </a>
          ))
        ) : (
          <div className="empty">
            <b>Илэрц олдсонгүй</b>
            <span>Өөр үгээр хайх эсвэл «Бүгд» ангиллыг сонгоорой.</span>
          </div>
        )}
      </div>

      {/*
        Урьдчилж татсан мэдээнээс цааш архив бий. Хайлттай үед үүнийг
        ҮРГЭЛЖ санал болгоно — цэсний «Илэрц олдсонгүй» нь «сайтад
        байхгүй» гэсэн үг БИШ.
      */}
      {query ? (
        <a className="chip" href={`/search?q=${encodeURIComponent(query)}`} onClick={onNavigate}>
          <b>«{query}» — бүх мэдээнээс хайх →</b>
        </a>
      ) : null}
    </>
  );
}
