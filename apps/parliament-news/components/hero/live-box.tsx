import { parseEmbed } from "../../lib/embeds";
import type { LiveInfo } from "../../lib/home-data";

/**
 * Нүүрний шууд дамжуулалт.
 *
 * Өмнө нь зөвхөн «ШУУД үзэх» гэсэн текст холбоос байв — уншигч сайтаас
 * гараад YouTube дээр очдог. Чуулган шууд явж байгаа үед хамгийн их
 * хэрэгтэй зүйл нь тэр урсгал өөрөө тул энд суулгав.
 *
 * Хаяг нь зөвшөөрөгдсөн хост (`lib/embeds.ts`) биш бол iframe БИШ,
 * холбоос гарна: танихгүй сайтын кодыг нүүрэндээ ажиллуулахгүй.
 */
export function LiveBox({ live }: { live: LiveInfo | null }) {
  if (!live?.liveOn || !live.liveUrl) return null;

  const embed = parseEmbed(live.liveUrl);

  return (
    <section className="livebox" aria-label="Шууд дамжуулалт">
      <div className="lvhead">
        <span className="tst on">ШУУД</span>
        <b>{live.sessionStatus}</b>
        <a href={live.liveUrl} target="_blank" rel="noopener">
          Эх сурвалж дээр нээх ↗
        </a>
      </div>

      {embed ? (
        <div className="lvframe" style={{ aspectRatio: embed.ratio }}>
          <iframe
            src={embed.src}
            title="Чуулганы шууд дамжуулалт"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : null}
    </section>
  );
}
