import { palette, isLight } from "../lib/cover";
import { mnNumericDate, mnShortDate, excerpt } from "../lib/format";
import { yearFraction } from "../lib/timeline";
import { coverUrl } from "../lib/cover-input";
import { BILL_STAGE_MAX } from "../lib/bill-stages";
import type { PostListItem } from "../lib/posts";

/**
 * Нурууны текстийн дээд урт. Нуруу нь номын зузаан (ws = H·0.25) төдий нарийн
 * тул урт гарчиг эргэж орохдоо халина.
 */
export const SPINE_TEXT_MAX = 42;

/** Artifact-ийн нурууны дугаарлалт "№ 141"-ээс эхэлдэг */
export const SHELF_FIRST_NUMBER = 141;


export type ShelfBook = {
  href: string;
  title: string;
  /** Нурууны шошго — ангиллын нэр */
  spineLabel: string;
  kicker: string;
  /** "№ 141" */
  number: string;
  /** "11.26" — нурууны доод талд */
  date: string;
  /** "2026.11.26" — гарчгийн блокт, artifact-ийн fmt-ээр */
  dateFull: string;
  /**
   * Огнооны байрлал жилийн дотор (0..1) — доорх цагийн шугамын цэг.
   * Серверт тооцоод явуулж байгаа нь client талд Thu Nov 26 18:39:12 UST 2026 дахин задлахгүйн тул.
   */
  fraction: number;
  /**
   * Хавтасны SVG-ийн ХАЯГ, агуулга нь биш.
   *
   * `Shelf` нь client component тул props нь SSR-ийн HTML-д БА RSC-ийн
   * payload-д хоёр удаа цувруулагдана. 12 хавтас inline байвал ~84 KB
   * болж, хэмжсэн зорилтыг (нийтлэлийн хуудас 100 KB-аас бага; ikon.mn
   * 59 KB) давна. Хаягаар үйлчилбэл HTML жижиг үлдэж, хавтас нь CDN-д
   * кэшлэгдэж, дэлгэцэнд ороогүй нь lazy ачаалагдана.
   */
  coverUrl: string;
  lead: string;
  bg: string;
  fg: string;
  light: boolean;
  /** Гарчгийн блокийн шар "ОНЦЛОХ" тэмдэг */
  featured: boolean;
  /**
   * Хуулийн төслийн шат (0..4) эсвэл null.
   *
   * Гарчгийн блокийн огнооны ард улаан хүрээтэй тэмдэг болж гарна
   * (artifact-ийн `.stg`). Мэдээнд хууль холбоогүй бол null.
   */
  stage: number | null;
};

/**
 * Мэдээний жагсаалтыг тавиурын номнууд болгоно — цэвэр функц.
 *
 * `shelf.tsx`-ээс тусдаа байгаа нь зориуд: client component-ийг рендерлэхгүйгээр
 * тавиурын логикийг тестлэх боломж (репод React рендерлэх тест байхгүй).
 */
export function shelfBooks(
  posts: PostListItem[],
  stages: Record<string, number> = {},
): ShelfBook[] {
  return posts.map((post, index) => {
    const raw = stages[post.slug];
    const stage =
      typeof raw === "number" && Number.isFinite(raw)
        ? Math.max(0, Math.min(BILL_STAGE_MAX, Math.round(raw)))
        : null;
    const [bg, fg] = palette(post.theme, post.look);
    return {
      href: `/news/${post.slug}`,
      title: post.title,
      spineLabel: post.categoryName,
      kicker: excerpt(post.kicker ?? post.title, SPINE_TEXT_MAX),
      number: `№ ${SHELF_FIRST_NUMBER + index}`,
      date: mnShortDate(post.date),
      dateFull: mnNumericDate(post.date),
      fraction: yearFraction(post.date),
      coverUrl: coverUrl(post.slug),
      lead: post.lead ?? "",
      bg,
      fg,
      light: isLight(bg),
      featured: post.featured,
      stage,
    };
  });
}
