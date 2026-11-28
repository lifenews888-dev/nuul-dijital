import type { Metadata } from "next";
import { requireTenant } from "../../../lib/tenant";
import { forTenant } from "../../../lib/tenant-db";
import { getSiteSetting } from "../../../lib/settings";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Сурталчилгаа байршуулах",
  description:
    "Parliament News дээр баннер болон гүйдэг мөрийн зар байршуулах байршил, хэмжээ, үнийн санал.",
};

/**
 * «Сурталчилгаа байршуулах» — artifact-ийн `PG.ads` модал.
 *
 * Модал БИШ, жинхэнэ хуудас: зар сонирхсон хүн хаягийг нь хуваалцах,
 * хайлтаар олох боломжтой байх ёстой. Үнийн мөрүүд нь редакцын
 * «Зарын үнийн санал» самбараас ирнэ — энд хатуу тоо БАЙХГҮЙ.
 */
const SIZES = [
  ["Мэдээний урсгалын баннер", "1200 × 300 px"],
  ["Хажуугийн баннер", "600 × 500 px"],
  ["Нийтлэл доторх баннер", "1200 × 400 px"],
  ["«ШУУД» гүйдэг мөрийн текст зар", "120 тэмдэгт хүртэл"],
];

export default async function AdsPage() {
  const tenant = await requireTenant();
  const db = forTenant(tenant.id);
  const [rates, foot] = await Promise.all([
    db.adRate.findMany({ orderBy: { order: "asc" } }),
    getSiteSetting("footer"),
  ]);

  const contact = foot.sales || foot.email;

  return (
    <article className="artpage">
      <div className="spread">
        <div className="pg L">
          <div className="dl">
            <div className="m">
              <span className="lbl dcat">PARLIAMENT NEWS</span>
            </div>

            <div className="m">
              <span>
                <h1 className="dt1">Сурталчилгаа байршуулах</h1>
              </span>
            </div>

            <div className="m">
              <span>
                <p className="dlede">
                  Улс төр, хууль тогтоомж, төсвийн шийдвэрийг өдөр бүр дагадаг уншигчдад шууд
                  хүрнэ. Зар бүр «ЗАР» шошготой гарах бөгөөд редакцын агуулгаас тусгаарлагдана.
                </p>
              </span>
            </div>

            <div className="m">
              <span>
                <div className="srch3">БАЙРШЛЫН ТӨРӨЛ</div>
                <ul className="alk">
                  {SIZES.map(([name, size]) => (
                    <li key={name}>
                      <b>{name}</b> — {size}
                    </li>
                  ))}
                </ul>
              </span>
            </div>

            {rates.length > 0 ? (
              <div className="m">
                <span>
                  <div className="srch3">ҮНИЙН САНАЛ</div>
                  <div className="fx">
                    {rates.map((r) => (
                      <div key={r.id}>
                        <span>
                          {r.place}
                          {r.size ? ` · ${r.size}` : ""}
                        </span>
                        <span>
                          {r.price.toLocaleString("mn-MN")}₮ / {r.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                  {rates.some((r) => r.note) ? (
                    <p className="isrc">
                      {rates
                        .map((r) => r.note)
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                </span>
              </div>
            ) : null}

            <div className="m">
              <span>
                <div className="srch3">ХОЛБОГДОХ</div>
                {contact ? (
                  <p className="dbody">
                    <a href={`mailto:${contact}`}>{contact}</a>
                    {foot.phone ? ` · ${foot.phone}` : ""}
                  </p>
                ) : (
                  <p className="dbody">Холбоо барих мэдээллийг удахгүй нийтэлнэ.</p>
                )}
              </span>
            </div>

            <div className="m">
              <span className="note">
                Зар нь редакцын шийдвэрт нөлөөлөхгүй. Хууль зөрчсөн, төөрөгдүүлсэн, сонгуулийн
                хуулиар хориглосон агуулгатай зарыг байршуулахгүй.
              </span>
            </div>
          </div>
        </div>

        <div className="pg R">
          <div className="dr">
            <div className="media" data-ar="wide">
              <div className="slides">
                <div className="slide">
                  <img className="fg" src="/artifact/flag.jpg" alt="" />
                </div>
              </div>
            </div>
            <p className="fcap">Parliament News · parlamentnews.mn</p>
          </div>
        </div>
      </div>
    </article>
  );
}
