import Link from "next/link";
import { getSiteSetting } from "../lib/settings";
import { menuCategories } from "../lib/posts";
import { headerModel } from "./site-chrome";

/**
 * Сайтын толгой — artifact-ийн `header.top`-ийн бүтэц, ангиллын нэрс.
 *
 * Markup нь artifact-ийнх, ӨГӨГДӨЛ нь өгөгдлийн сангаас: цэсний ангиллууд,
 * уриа, логоны хэмжээ бүгд `headerModel()`-ээр дамжина. `site-chrome.ts`-ийн
 * загвар өөрчлөгдөөгүй тул түүний 11 тест хэвээр ногоон.
 *
 * `#thm` (өдөр/шөнө) ба `#burger` (цэс)-ийн зан төлөв Task 10-д — одоо тэд
 * байрлалдаа байна, дарахад юу ч болохгүй.
 */
export async function SiteHeader() {
  const [setting, categories] = await Promise.all([
    getSiteSetting("header"),
    menuCategories(),
  ]);
  const model = headerModel(setting, categories);

  return (
    <header className="top">
      <Link className="brand lbl" href="/" aria-label="Parliament News нүүр">
        <img className="logo d" src="/artifact/logo.png" alt="Parliament News" />
        <img className="logo w" src="/artifact/logo-white.png" alt="" />
        <i />
        <span>parlamentnews.mn</span>
        <em className="btag" id="btag">
          {model.tagline}
        </em>
      </Link>

      <nav className="nav lbl">
        <span className="navc" id="navc">
          {model.items.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </span>

        <button className="thm" id="thm" type="button" aria-label="Өдөр, шөнийн горим">
          <svg className="ic0" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
          </svg>
        </button>

        <Link className="live" href="/c/video" id="live">
          Шууд
        </Link>

        <button className="burger" id="burger" type="button" aria-label="Цэс ба хайлт">
          <i />
          <i />
        </button>
      </nav>
    </header>
  );
}
