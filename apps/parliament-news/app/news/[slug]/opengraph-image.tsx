import { ImageResponse } from "next/og";
import { postBySlug } from "../../../lib/posts";
import { palette } from "../../../lib/cover";
import { mnDate } from "../../../lib/format";
import { absoluteUrl } from "../../../lib/seo";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Парламентын мэдээ";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

/**
 * Фонтыг энэ файлын ХАЖУУГААС уншина, `process.cwd() + "public/..."`-ээс биш.
 *
 * Next-ийн build мөрдөгч `public/`-ийг функцийн багцад хуулдаггүй: өмнөх
 * хувилбарын `.nft.json` нь 73 файл жагсааж байсан ч нэг ч `.ttf` байгаагүй —
 * Vercel дээр ENOENT болж нийтлэл бүрийн OG зураг 500 болох байсан.
 * `new URL(..., import.meta.url)` нь статикаар мөрдөгдөж, файл багцад орно.
 *
 * Кирилл дэмждэг хувилбар: @vercel/og-ийн анхдагч фонт нь зөвхөн латин тул
 * монгол гарчиг хоосон дөрвөлжин болно.
 */
let fontCache: ArrayBuffer | null = null;

async function headFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;

  const url = new URL("./inter-tight-800.ttf", import.meta.url);
  const data = await fetch(url).then((r) => r.arrayBuffer());
  fontCache = data;
  return data;
}

/**
 * Нийтлэлийн Open Graph зураг.
 *
 * `coverSvg`-ийг шууд хэрэглэхгүй: `next/og` нь Satori-гоор зурдаг бөгөөд
 * дурын SVG тэмдэгт мөрийг растерлахгүй. Оронд нь ижил палитрыг хуваалцаж,
 * хавтастай нэг гэр бүлийн харагдацтай зураг угсарна.
 *
 * Зураггүй мэдээнд ч ажиллана — баруун талд палитрын хоёр өнгийн геометр.
 */
export default async function OgImage({ params }: { params: { slug: string } }) {
  const post = await postBySlug(params.slug);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0A22E0",
            color: "#F3F0EA",
            fontSize: 56,
          }}
        >
          Парламентын мэдээ
        </div>
      ),
      {
        ...size,
        // Энд ч фонт ЗААВАЛ: цорын ганц текст нь монгол, анхдагч латин фонтод
        // хоосон дөрвөлжин болно
        fonts: [
          { name: "Inter Tight", data: await headFont(), weight: 800, style: "normal" },
        ],
      },
    );
  }

  const [bg, fg, ac] = palette(post.theme, post.look);
  const hero = post.imageUrl ? absoluteUrl(post.imageUrl, SITE) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: bg }}>
        {/* Зүүн тал: нэр, гарчиг, ангилал ба огноо */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: hero ? "58%" : "100%",
            padding: 56,
            color: fg,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 54, height: 6, background: ac }} />
            <div style={{ fontSize: 22, letterSpacing: 2 }}>PARLAMENT NEWS</div>
          </div>

          <div style={{ display: "flex", fontSize: hero ? 52 : 64, lineHeight: 1.1 }}>
            {post.title.slice(0, 120)}
          </div>

          <div style={{ display: "flex", fontSize: 24, color: fg, opacity: 0.85 }}>
            {post.categoryName} · {mnDate(post.date)}
          </div>
        </div>

        {/* Баруун тал: зураг, байхгүй бол палитрын геометр */}
        {hero ? (
          <img src={hero} width={504} height={630} style={{ objectFit: "cover" }} alt="" />
        ) : (
          <div
            style={{
              display: "flex",
              position: "absolute",
              right: 0,
              top: 0,
              width: 300,
              height: 630,
              background: ac,
              opacity: 0.9,
            }}
          />
        )}
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Inter Tight", data: await headFont(), weight: 800, style: "normal" }],
    },
  );
}
