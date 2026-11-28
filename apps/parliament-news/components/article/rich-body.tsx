import { parseRich, type Block, type Span } from "../../lib/rich-text";
import { parseEmbed } from "../../lib/embeds";

/**
 * Мэдээний биет — БҮТЭЦЛЭГДСЭН блокуудаар.
 *
 * `dangerouslySetInnerHTML` ЭНД БАЙХГҮЙ бөгөөд байх ч ёсгүй: `lib/rich-text.ts`
 * нь HTML огт үүсгэдэггүй, зөвхөн текст ба тугууд буцаадаг. React нь текстийг
 * өөрөө escape хийнэ, тул редактор `<script>` бичвэл уншигч ТҮҮНИЙГ харна,
 * ажиллахгүй. Энэ нь sanitize сангаас илүү найдвартай: тойрох зам байхгүй.
 */

function Spans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((s, i) => {
        if (s.href) {
          return (
            <a key={i} href={s.href} target="_blank" rel="noopener nofollow">
              {s.text}
            </a>
          );
        }
        if (s.bold) return <b key={i}>{s.text}</b>;
        if (s.italic) return <i key={i}>{s.text}</i>;
        return <span key={i}>{s.text}</span>;
      })}
    </>
  );
}

/**
 * Шигтгээ. `parseEmbed` нь зөвшөөрөгдсөн хост танихгүй бол `null` —
 * тэр үед iframe БИШ, энгийн холбоос гарна: уншигч хаашаа очихоо хараад
 * өөрөө шийднэ.
 */
function Embedded({ url }: { url: string }) {
  const e = parseEmbed(url);
  if (!e) {
    return (
      <p>
        <a href={url} target="_blank" rel="noopener nofollow">
          {url}
        </a>
      </p>
    );
  }
  return (
    <div className="emb" style={{ aspectRatio: e.ratio }}>
      <iframe
        src={e.src}
        title={`${e.host} шигтгээ`}
        loading="lazy"
        allowFullScreen
        /*
         * `no-referrer` БИШ. YouTube нь referrer-гүй хүсэлтийг шигтгээ
         * хориглосон гэж үзээд «Error 153» буцаана — бодитоор тохиолдсон.
         * `strict-origin-when-cross-origin` нь зөвхөн гарал үүслийг
         * дамжуулна: уншигчийн яг аль нийтлэл уншиж буй нь гадагш гарахгүй.
         */
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
      />
    </div>
  );
}

function One({ block }: { block: Block }) {
  switch (block.kind) {
    case "h3":
      return (
        <h3>
          <Spans spans={block.spans} />
        </h3>
      );
    case "quote":
      return (
        <blockquote>
          <Spans spans={block.spans} />
        </blockquote>
      );
    case "pull":
      return (
        <blockquote className="pq">
          <Spans spans={block.spans} />
        </blockquote>
      );
    case "list":
      return (
        <ul>
          {block.items.map((item, i) => (
            <li key={i}>
              <Spans spans={item} />
            </li>
          ))}
        </ul>
      );
    case "img":
      return (
        <figure>
          <img src={block.url} alt={block.caption ?? ""} loading="lazy" />
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      );
    case "embed":
      return <Embedded url={block.url} />;
    default:
      return (
        <p>
          <Spans spans={block.spans} />
        </p>
      );
  }
}

export function RichBody({ body }: { body: string | null }) {
  const blocks = parseRich(body);
  if (blocks.length === 0) return null;

  return (
    <div className="dbody">
      {blocks.map((b, i) => (
        <One key={i} block={b} />
      ))}
    </div>
  );
}
