import type { ReactNode } from "react";
import { getSiteSetting } from "../lib/settings";
import { menuCategories } from "../lib/posts";
import { footerModel } from "./site-chrome";

const SOCIAL_LABEL: Record<string, string> = {
  fb: "Facebook",
  yt: "YouTube",
  ig: "Instagram",
  x: "X",
};

const SOCIAL_PATH: Record<string, ReactNode> = {
  fb: (
    <path
      d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v1.9H8V11.7h2.6V21.5H14v-9.8h2.7l.4-3.2z"
      fill="currentColor"
    />
  ),
  x: (
    <path
      d="M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.3L5.6 21h-3l7.1-8.1L2.3 3h6.2l4.3 5.7zm-1 16.2h1.7L7.3 4.7H5.5z"
      fill="currentColor"
    />
  ),
  ig: (
    <>
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </>
  ),
  yt: (
    <path
      d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15V9l5.2 3z"
      fill="currentColor"
    />
  ),
};

/**
 * Сайтын хөл — artifact-ийн `footer.sfoot` (index.html:631).
 *
 * `footerModel()`-ийн гаралт ХЭВЭЭР: зөвхөн markup солигдов, тиймээс
 * `site-chrome.test.ts` ногоон үлдэнэ.
 *
 * Artifact-ийн «Бидний тухай» багана нь `data-pg` модал цонхнууд. Бидэнд
 * тэр хуудсууд хараахан байхгүй тул `about`/`policy` текстийг ТЭНД ШУУД
 * хэвлэнэ — агуулга нь алдагдахгүй, тасархай холбоос ч үүсэхгүй.
 *
 * Горимын сонгогч (artifact-ийн `#sfTheme`) энд алга: `#thm` толгойн
 * товчтой хамт Task 10-д орно. Хоёр газар хагас ажиллахаас нэг газар
 * бүтэн ажиллах нь дээр.
 */
export async function SiteFooter() {
  const [model, categories] = await Promise.all([
    getSiteSetting("footer").then(footerModel),
    menuCategories(),
  ]);

  const sales = model.contact.find((c) => c.label === "Сурталчилгаа")?.value;
  const year = new Date().getUTCFullYear();

  return (
    <footer className="sfoot" id="sfoot">
      <div className="sfw">
        <div className="sfb">
          <a href="#" className="sflogo" aria-label="Дээш буцах">
            <img
              src="/artifact/logo-white.png"
              alt="Parliament News"
              width="160"
              height="36"
            />
          </a>
          <p>Хараат бус, хариуцлагатай улс төрийн мэдээ. Төр ба иргэний гүүр.</p>

          {model.contact.length > 0 ? (
            <ul className="sfc">
              {model.contact.map((row) => (
                <li key={row.label}>
                  {row.label}:{" "}
                  {row.label === "И-мэйл" || row.label === "Сурталчилгаа" ? (
                    <a href={`mailto:${row.value}`}>{row.value}</a>
                  ) : (
                    <span>{row.value}</span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {model.socials.length > 0 ? (
            <div className="sfso">
              {model.socials.map((s) => (
                <a
                  key={s.kind}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer me"
                  aria-label={SOCIAL_LABEL[s.kind]}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {SOCIAL_PATH[s.kind]}
                  </svg>
                </a>
              ))}
            </div>
          ) : null}
        </div>

        {categories.length > 0 ? (
          <nav className="sfn" aria-label="Ангилал">
            <h3>Ангилал</h3>
            <ul>
              {categories.map((c) => (
                <li key={c.slug}>
                  <a href={`/c/${c.slug}`}>{c.name}</a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <nav className="sfn" aria-label="Хамтран ажиллах">
          <h3>Хамтран ажиллах</h3>
          <ul>
            <li>
              <a href="/rss.xml">RSS мэдээний суваг</a>
            </li>
            {sales ? (
              <li>
                <a href={`mailto:${sales}`}>Сурталчилгаа байршуулах</a>
              </li>
            ) : null}
          </ul>
        </nav>

        {model.texts.length > 0 ? (
          <div className="sfn">
            {model.texts.map((block) => (
              <div key={block.label}>
                <h3>{block.label}</h3>
                <p>{block.body}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="sfbot">
        <span>© {year} Parliament News · Бүх эрх хуулиар хамгаалагдсан</span>
        <span>
          УИХ-ын албан ёсны сайт биш · Хуулийн эх:{" "}
          <a href="https://legalinfo.mn" target="_blank" rel="noopener">
            legalinfo.mn
          </a>
        </span>
        <a className="sfup" href="#" aria-label="Дээш буцах">
          ↑ Дээш
        </a>
      </div>
    </footer>
  );
}
