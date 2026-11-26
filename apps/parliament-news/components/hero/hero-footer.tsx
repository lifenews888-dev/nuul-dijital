import { getSiteSetting } from "../../lib/settings";
import { footerModel } from "../site-chrome";

const SOCIAL_LABEL: Record<string, string> = {
  fb: "FACEBOOK",
  yt: "YOUTUBE",
  ig: "INSTAGRAM",
  x: "X",
};

/** Hero дээр хэдэн сувгийг багтаах — илүү нь мөрийг түлхэнэ */
const MAX_SOCIALS = 2;

/**
 * Hero-гийн доод мөр — artifact-ийн `footer.foot` (index.html:620).
 *
 * `position: fixed`, тавиурын доор. «Бүх мэдээ ↓» нь artifact-д JS-ээр
 * гүйлгэдэг товч; энд `#feed` руу чиглэсэн ЖИНХЭНЭ зангуу — JS-гүй ч
 * ажиллана, хөтөч өөрөө зөөлөн гүйлгэнэ.
 */
export async function HeroFooter() {
  const model = footerModel(await getSiteSetting("footer"));
  const socials = model.socials.slice(0, MAX_SOCIALS);
  const year = new Date().getUTCFullYear();

  return (
    <footer className="foot">
      <span className="lbl">© {year} PARLIAMENT NEWS</span>
      <a className="fdn" href="#feed">
        Бүх мэдээ <b>↓</b>
      </a>
      <span className="lbl">
        {socials.map((s, i) => (
          <span key={s.kind}>
            {i > 0 ? " / " : null}
            <a href={s.href} target="_blank" rel="noopener noreferrer me">
              {SOCIAL_LABEL[s.kind]}
            </a>
          </span>
        ))}
      </span>
    </footer>
  );
}
