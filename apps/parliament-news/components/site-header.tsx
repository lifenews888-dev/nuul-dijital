import Link from "next/link";
import { getSiteSetting } from "../lib/settings";
import { menuCategories } from "../lib/posts";
import { headerModel } from "./site-chrome";

/**
 * Сайтын толгой. Тохиргоо (лого хэмжээ, уриа, цэсний хэлбэр) ба цэсэнд
 * тавьсан ангиллуудыг өгөгдлийн сангаас уншина — кодод шивэхгүй.
 */
export async function SiteHeader() {
  const [setting, categories] = await Promise.all([
    getSiteSetting("header"),
    menuCategories(),
  ]);
  const model = headerModel(setting, categories);
  const centered = model.align === "center";

  return (
    <header className="border-b border-rule/20 bg-sheet">
      <div
        className={`mx-auto flex max-w-page flex-col gap-1 px-4 py-5 ${
          centered ? "items-center text-center" : "items-start"
        }`}
      >
        <Link href="/" className="font-head font-extrabold tracking-tight">
          <span
            className="block leading-none"
            style={{ fontSize: `${model.logoScale}px` }}
          >
            Парламентын мэдээ
          </span>
        </Link>
        {model.tagline ? (
          <p className="font-head text-sm text-muted">{model.tagline}</p>
        ) : null}
      </div>

      <nav aria-label="Үндсэн цэс" className="border-t border-rule/15">
        <ul
          className={`mx-auto flex max-w-page flex-wrap gap-x-5 gap-y-2 px-4 py-2 font-head text-sm font-semibold ${
            centered ? "justify-center" : ""
          }`}
        >
          {model.items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="hover:text-cob">
                {item.label}
              </Link>
            </li>
          ))}
          <li className="ms-auto">
            <Link href="/search" className="text-muted hover:text-cob">
              Хайх
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
