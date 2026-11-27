"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./icon";
import { MenuResults } from "./menu-results";
import type { MenuPost } from "../lib/menu-filter";

const FOCUSABLE = 'button, [href], input, [tabindex]:not([tabindex="-1"])';

/**
 * Цэс ба хайлтын давхарга — artifact-ийн `#menu` (index.html:671).
 *
 * Толгойн `#burger` нь СЕРВЕРЭЭС ирсэн товч; энэ компонент түүнд сонсогч
 * залгана (стори үзүүлэгчтэй ижил загвар), тиймээс толгой нь серверийн
 * компонент хэвээр.
 *
 * Хайлт нь жинхэнэ `<form action="/search">`: JS ачаалагдаагүй байхад ч
 * Enter дарахад хайлтын хуудас нээгдэнэ. Ангиллууд нь жинхэнэ холбоос.
 *
 * Давхарга нь `header.top`-ийн ДОТОР БИШ: `.top` нь `z-index: 58`-тай
 * өөрийн давхаргын хүрээ үүсгэдэг тул цэс түүний дотор байвал толгой нь
 * цэсний дээр үлдэнэ.
 */
export function SiteMenu({
  posts,
  order,
}: {
  posts: MenuPost[];
  order: string[];
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const burger = document.getElementById("burger");
    if (!burger) return;
    const onClick = () => {
      openerRef.current = burger;
      setOpen(true);
    };
    burger.addEventListener("click", onClick);
    return () => burger.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const opener = openerRef.current;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";

    // Хурууны дэлгэцэд гар автоматаар гарч ирэхгүй — эхлээд хаах товч
    const fine = window.matchMedia("(pointer: fine)").matches;
    const first = fine
      ? document.getElementById("q")
      : document.getElementById("mclose");
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const box = boxRef.current;
      if (!box) return;
      const items = Array.from(box.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const edge = e.shiftKey ? items[0] : items[items.length - 1];
      if (document.activeElement === edge) {
        e.preventDefault();
        (e.shiftKey ? items[items.length - 1] : items[0]).focus();
      }
    };

    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      root.style.overflow = prev;
      opener?.focus();
    };
  }, [open, close]);

  return (
    <section
      className="menu"
      id="menu"
      hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-label="Цэс ба хайлт"
      ref={boxRef}
    >
      <div className="mh">
        <a className="mlg" href="/" aria-label="Parliament News нүүр">
          <img
            className="logo d"
            src="/artifact/logo.png"
            alt="Parliament News"
            width={123}
            height={28}
          />
          <img
            className="logo w"
            src="/artifact/logo-white.png"
            alt=""
            width={123}
            height={28}
          />
        </a>
        <button className="mx" id="mclose" type="button" aria-label="Хаах" onClick={close}>
          ✕
        </button>
      </div>

      <div className="mi">
        <div>
          <MenuResults posts={posts} order={order} onNavigate={close} />
        </div>

        <aside className="about">
          <div className="abh">
            <span className="abk">PARLIAMENT NEWS</span>
            <h2>Бидний тухай</h2>
            <p>Хараат бус, хариуцлагатай улс төрийн мэдээ.</p>
          </div>
          <ul className="abv">
            <li>
              <svg className="ic0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <div>
                <h3>Алсын хараа</h3>
                <p>Хариуцлагатай сэтгүүл зүйгээр төр, иргэний гүүр болно.</p>
              </div>
            </li>
            <li>
              <svg className="ic0" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="12" cy="12" r="1.2" fill="currentColor" />
              </svg>
              <div>
                <h3>Эрхэм зорилго</h3>
                <p>Аливаа ашиг сонирхлоос ангид, тэнцвэртэй сэтгүүл зүйг баримтална.</p>
              </div>
            </li>
            <li>
              <svg className="ic0" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z" />
                <path d="M8.5 12l2.5 2.5 4.5-5" />
              </svg>
              <div>
                <h3>Үнэт зүйл</h3>
                <p>Мэргэжлийн сэтгүүл зүй. Тэнцвэртэй байр суурь.</p>
              </div>
            </li>
          </ul>
          {/* Artifact-ийн `.mlinks` — дүрс, нэр, сум */}
          <nav className="mlinks abl" aria-label="Холбоос">
            <a href="/c/video">
              <Icon name="video" />
              <span>Видео мэдээ</span>
              <Icon name="chevron" className="abch" />
            </a>
            <a href="/rss.xml">
              <Icon name="file" />
              <span>RSS мэдээний суваг</span>
              <Icon name="chevron" className="abch" />
            </a>
            <a href="https://legalinfo.mn" target="_blank" rel="noopener">
              <Icon name="scale" />
              <span>Хуулийн эх — legalinfo.mn</span>
              <Icon name="external" className="abch" />
            </a>
          </nav>

          <div className="abf">
            {/*
              Редакцын нэвтрэх — artifact-ийн `.abadm`. Хаалгатай зам тул
              нэвтрээгүй хүнийг нэвтрэх хуудас руу чиглүүлнэ.
            */}
            <a href="/studio" className="abadm" title="Редакцын нэвтрэх">
              <Icon name="tag" />
              <span>Редакц</span>
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
