"use client";

import { useCallback, useEffect, useState } from "react";
import { clampFz, shareLinks, FZ_MIN, FZ_MAX, FZ_STEP } from "../../lib/reading";

const FZ_KEY = "pn_fz";

function Share() {
  return (
    <path
      d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

const FB = (
  <path
    d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v1.9H8V11.7h2.6V21.5H14v-9.8h2.7l.4-3.2z"
    fill="currentColor"
  />
);
const X = (
  <path
    d="M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.3L5.6 21h-3l7.1-8.1L2.3 3h6.2l4.3 5.7zm-1 16.2h1.7L7.3 4.7H5.5z"
    fill="currentColor"
  />
);
const TG = (
  <path
    d="M21.5 4.2 2.9 11.4c-1.3.5-1.3 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.6.4.8.8.8.4 0 .6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.8c.3-1.3-.5-1.9-1.4-1.6zM9 14.2l9.2-5.8c.4-.3.8-.1.5.2l-7.9 7.1-.3 3.3z"
    fill="currentColor"
  />
);
const LINK = (
  <path
    d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L12 5.6M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  />
);

function Ic({ children, ...rest }: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

/** Хуваалцах таван товч — дээд ба доод мөрөнд адилхан. */
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const L = shareLinks(url, title);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard хаалттай орчин — чимээгүй өнгөрүүлнэ */
    }
  }, [url]);

  /** Утсан дээр системийн хуваалцах хуудас; ширээн дээр холбоос хуулна. */
  const native = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.share) {
      void navigator.share({ title, url }).catch(() => undefined);
    } else {
      void copy();
    }
  }, [title, url, copy]);

  return (
    <>
      <button type="button" className="ic" onClick={native} aria-label="Хуваалцах" title="Хуваалцах">
        <Ic>
          <Share />
        </Ic>
      </button>
      <a className="ic fb" href={L.facebook} target="_blank" rel="noopener" aria-label="Facebook-т хуваалцах" title="Facebook">
        <Ic>{FB}</Ic>
      </a>
      <a className="ic" href={L.x} target="_blank" rel="noopener" aria-label="X-т хуваалцах" title="X">
        <Ic>{X}</Ic>
      </a>
      <a className="ic" href={L.telegram} target="_blank" rel="noopener" aria-label="Telegram-аар илгээх" title="Telegram">
        <Ic>{TG}</Ic>
      </a>
      <button
        type="button"
        className="ic"
        onClick={() => void copy()}
        aria-label="Холбоос хуулах"
        title="Холбоос хуулах"
      >
        <Ic>{LINK}</Ic>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Холбоос хуулагдлаа" : ""}
      </span>
    </>
  );
}

/**
 * Үсгийн хэмжээ. `--fz`-г `.spread`-д тавина — artifact-ийн дүрэм
 * (`.dlede{font-size:calc(18px*var(--fz))}`) түүнээс уншина.
 */
function FontSize() {
  const [fz, setFz] = useState(1);

  useEffect(() => {
    let saved = 1;
    try {
      saved = clampFz(Number(localStorage.getItem(FZ_KEY)) || 1);
    } catch {
      /* хувийн цонх */
    }
    setFz(saved);
  }, []);

  useEffect(() => {
    document.querySelector<HTMLElement>(".spread")?.style.setProperty("--fz", String(fz));
    try {
      localStorage.setItem(FZ_KEY, String(fz));
    } catch {
      /* хувийн цонх */
    }
  }, [fz]);

  return (
    <span className="fzg">
      <button
        type="button"
        className="ic tx"
        onClick={() => setFz((v) => clampFz(v - FZ_STEP))}
        disabled={fz <= FZ_MIN}
        aria-label="Үсэг жижигрүүлэх"
        title="Үсэг жижигрүүлэх"
      >
        A<small>−</small>
      </button>
      <button
        type="button"
        className="ic tx"
        onClick={() => setFz((v) => clampFz(v + FZ_STEP))}
        disabled={fz >= FZ_MAX}
        aria-label="Үсэг томруулах"
        title="Үсэг томруулах"
      >
        A<small>+</small>
      </button>
    </span>
  );
}

/**
 * Сонсох — хөтчийн ярианы нийлэгжүүлэгч.
 *
 * Дэмжихгүй хөтөч дээр товч нь ОГТ гарахгүй: дарагдаад юу ч болдоггүй
 * товч нь байхгүй товчноос дор.
 */
function Listen({ text }: { text: string }) {
  const [can, setCan] = useState(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    setCan(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* дэмжихгүй */
      }
    };
  }, []);

  if (!can || !text.trim()) return null;

  const toggle = () => {
    const s = window.speechSynthesis;
    if (on) {
      s.cancel();
      setOn(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
    u.lang = "mn-MN";
    u.onend = () => setOn(false);
    u.onerror = () => setOn(false);
    s.cancel();
    s.speak(u);
    setOn(true);
  };

  return (
    <button type="button" className="bt sm" onClick={toggle} aria-pressed={on}>
      <svg className="ic0" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z" />
        <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
      </svg>
      {/*
        Шошгыг `.wl`-д: artifact нь 480px-ээс нарийнд `.tbar .wl{display:none}`
        болгож товчийг 36×36 дугуй болгодог. Шошго нь хальж гарахгүй.
      */}
      <span className="wl">{on ? " Зогсоох" : " Сонсох"}</span>
    </button>
  );
}

/** Гарчгийн доорх хэрэгслийн мөр */
export function ReaderTools({
  url,
  title,
  speech,
}: {
  url: string;
  title: string;
  speech: string;
}) {
  return (
    <>
      <ShareButtons url={url} title={title} />
      <i className="sep" />
      <FontSize />
      <Listen text={speech} />
    </>
  );
}
