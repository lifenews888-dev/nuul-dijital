/**
 * Бичих зуурт үлдсэн жижиг согогийг цэгцэлнэ — admin.html-ийн `autoFix`.
 *
 * ДОГОЛ МӨР нь ариун: нийтийн нийтлэлийн хуудас биетийг хоосон мөрөөр
 * хуваадаг (`lib/article.ts`-ийн `paragraphs`). Хоосон мөрийг
 * цэвэрлэвэл бүх мэдээ нэг урт блок болно — хамгийн хямд арга нь
 * мөр мөрөөр нь боловсруулж, мөрийн ТӨГСГӨЛИЙГ хөндөхгүй байх.
 */

/** Цэг таслал — дараа нь зай орох ёстой тэмдэгтүүд */
const PUNCT = ",.!?;:";

function fixLine(line: string): string {
  let s = line;

  // Англи хашилтыг монгол болгох: хос хос нь
  s = s.replace(/"([^"]*)"/g, "«$1»");

  // Гурван цэг → нэг тэмдэг
  s = s.replace(/\.{3,}/g, "…");

  // Давхар зай
  s = s.replace(/[ \t]{2,}/g, " ");

  // Цэг таслалын ӨМНӨХ зай
  s = s.replace(new RegExp(`[ \t]+([${PUNCT}])`, "g"), "$1");

  /*
   * Цэг таслалын ДАРААХ зай — гэхдээ тоонуудын хооронд БИШ.
   * «2026.11.27», «40,5 хувь» нь зөв бичлэг; тэнд зай нэмбэл огноо,
   * бутархай тоо бүр эвдэрнэ.
   */
  s = s.replace(new RegExp(`([${PUNCT}])(?=[^\\s${PUNCT}])`, "g"), (m, p, offset: number) => {
    const before = s[offset - 1];
    const after = s[offset + 1];
    const between = /\d/.test(before ?? "") && /\d/.test(after ?? "");
    return between ? p : `${p} `;
  });

  return s.trim();
}

export function autoFix(text: string): string {
  return text
    .split("\n")
    .map(fixLine)
    .join("\n")
    /** Гурав ба түүнээс дээш хоосон мөр нь нэг л догол мөрийн зай */
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
