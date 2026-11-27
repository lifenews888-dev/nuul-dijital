import { Icon, type IconName } from "./icon";
import { CURRENCY_SYMBOL, TICKER_FX, changeOf, mnNumber } from "../lib/info";
import { mnNumericDate } from "../lib/format";
import type { SiteInfo } from "../lib/info-data";

/**
 * Цаг агаар ба ханшийн гурван харагдац — artifact-ийн `applyInfo()`.
 *
 * `.tinfo` (гүйдэг мөр), `.minfo` (цэсний «ӨНӨӨДӨР»), `.minfo2` (утасны
 * хэвтээ зурвас). Гурвуулаа НЭГ `siteInfo()`-оос тэжээгдэнэ.
 */

/** Өсөлт/бууралтын сум. Өөрчлөлтгүйд юу ч зурахгүй. */
function Change({ change }: { change: number }) {
  const c = changeOf(change);
  if (!c) return null;
  return (
    <span className={c.dir}>
      {c.dir === "up" ? "▲" : "▼"}
      {c.text}
    </span>
  );
}

/**
 * Гүйдэг мөрийн баруун тал.
 *
 * Гурван валютыг зурах боловч эхнийхээс бусад нь `.fxx` ангитай — artifact
 * түүнийг `display:none` болгодог. Зөрүүтэй санагдаж болох ч зориуд: ижил
 * HTML-ийг `.minfo2` нь `.fxx`-гүйгээр дахин хэрэглэж, утсан дээр гурвууланг
 * нь харуулдаг. Өөрөөр хэлбэл ширээн дээр нэг, утсан дээр гурав.
 */
export function TickerInfo({ info, strip = false }: { info: SiteInfo; strip?: boolean }) {
  const { weather, fx } = info;
  if (!weather && fx.length === 0) return null;

  return (
    <>
      {weather ? (
        <span>
          <Icon name={weather.icon as IconName} /> {weather.temp}°C {weather.city}
        </span>
      ) : null}
      {fx.slice(0, TICKER_FX).map((r, i) => (
        <span key={r.code} className={!strip && i > 0 ? "fxx" : undefined}>
          {r.code} {mnNumber(r.value)}₮ <Change change={r.change} />
        </span>
      ))}
    </>
  );
}

/** Цэсний «ӨНӨӨДӨР» блок */
export function MenuToday({ info }: { info: SiteInfo }) {
  const { weather, fx, fxSource, at } = info;
  if (!weather && fx.length === 0) return null;

  return (
    <div className="minfo">
      <h3>ӨНӨӨДӨР</h3>

      {weather ? (
        <div className="wx">
          <i>
            <Icon name={weather.icon as IconName} />
          </i>
          <b>{weather.temp}°</b>
          <span>
            {weather.city}
            <br />
            {weather.text}
          </span>
        </div>
      ) : null}

      {fx.length > 0 ? (
        <>
          <div className="fx">
            {fx.map((r) => (
              <div key={r.code}>
                <span>
                  {CURRENCY_SYMBOL[r.code] ?? ""} {r.code}
                </span>
                <span>
                  {mnNumber(r.value)}₮ <Change change={r.change} />
                </span>
              </div>
            ))}
          </div>
          <span className="isrc">
            Ханш: {fxSource.trim() || "Монголбанк"}
            {at ? ` · ${mnNumericDate(at)}` : ""}
          </span>
        </>
      ) : null}
    </div>
  );
}
