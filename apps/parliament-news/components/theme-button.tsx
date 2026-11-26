"use client";

/** Artifact-ийн түлхүүр (index.html) — хуучин сонголт хадгалагдана */
export const THEME_KEY = "pn_theme";

/**
 * Өдөр/шөнийн горимын товч — artifact-ийн `#thm`.
 *
 * Хоёр тэмдэг ХОЁУЛАА зурагдаж, алийг нь харуулахыг CSS шийднэ
 * (`globals.css`-ийн `.thm .ic-sun` / `.ic-moon`). Ингэснээр JS ачаалагдахаас
 * өмнө ч зөв тэмдэг харагдана — эффектээр сольбол эхний кадрт буруу тэмдэг
 * анивчина.
 *
 * `localStorage` нь хувийн цонхонд шиддэг тул `try/catch` — санахгүй байх
 * нь горим солигдохгүй байхаас дээр.
 */
export function ThemeButton() {
  const toggle = () => {
    const root = document.documentElement;
    const dark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    const next = dark ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* хувийн цонх — сонголт санагдахгүй, гэхдээ ажиллана */
    }
  };

  return (
    <button
      className="thm"
      id="thm"
      type="button"
      aria-label="Өдөр, шөнийн горим"
      onClick={toggle}
    >
      <svg className="ic0 ic-moon" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
      </svg>
      <svg className="ic0 ic-sun" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    </button>
  );
}
