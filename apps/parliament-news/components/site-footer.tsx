import { getSiteSetting } from "../lib/settings";
import { footerModel } from "./site-chrome";

const SOCIAL_LABEL: Record<string, string> = {
  fb: "Facebook",
  yt: "YouTube",
  ig: "Instagram",
  x: "X",
};

/**
 * Сайтын хөл. `about` ба `policy` нь artifact-д урт текст (1500 / 2000
 * тэмдэгт) тул холбоос биш, текстийн блок болж гарна.
 */
export async function SiteFooter() {
  const model = footerModel(await getSiteSetting("footer"));
  const empty =
    model.contact.length === 0 && model.texts.length === 0 && model.socials.length === 0;

  return (
    <footer className="mt-16 border-t border-rule/20 bg-sheet">
      <div className="mx-auto grid max-w-page gap-8 px-4 py-10 md:grid-cols-3">
        {model.contact.length > 0 ? (
          <section>
            <h2 className="font-head text-xs font-bold uppercase tracking-widest text-muted">
              Холбоо барих
            </h2>
            <dl className="mt-3 space-y-1 text-sm">
              {model.contact.map((row) => (
                <div key={row.label} className="flex gap-2">
                  <dt className="text-muted">{row.label}:</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {model.texts.map((block) => (
          <section key={block.label}>
            <h2 className="font-head text-xs font-bold uppercase tracking-widest text-muted">
              {block.label}
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">
              {block.body}
            </p>
          </section>
        ))}
      </div>

      <div className="mx-auto flex max-w-page flex-wrap items-center gap-4 border-t border-rule/15 px-4 py-4 font-head text-xs text-muted">
        <p>© {new Date().getUTCFullYear()} Парламентын мэдээ</p>
        {model.socials.length > 0 ? (
          <ul className="flex gap-4">
            {model.socials.map((s) => (
              <li key={s.kind}>
                <a
                  href={s.href}
                  rel="noopener noreferrer me"
                  target="_blank"
                  className="hover:text-cob"
                >
                  {SOCIAL_LABEL[s.kind]}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        <a href="/rss.xml" className="ms-auto hover:text-cob">
          RSS
        </a>
        {empty ? (
          <span className="text-muted">Тохиргоог редакцын хэсгээс бөглөнө</span>
        ) : null}
      </div>
    </footer>
  );
}
