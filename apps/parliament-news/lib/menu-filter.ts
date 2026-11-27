import type { IconName } from "../components/icon";

/**
 * Цэсний шүүлт — artifact-ийн `renderRes()` (index.html:952-963).
 *
 * Цэвэр тооцоо: чипүүдийн тоолол, хугацааны хил, текстийн хайлт. Эдгээр
 * нь компонентод шууд байвал тест хүрэхгүй, гэтэл алдаа нь яг энд гардаг
 * — хоосон ангилалд чип гаргах, «Видео» ангиллыг давхар харуулах,
 * хугацааны хил нэг өдрөөр гулсах.
 */

/** Чипийн түлхүүр: `all`, `vid`, `bill`, эсвэл ангиллын НЭР */
export type ChipKey = string;

export type MenuPost = {
  slug: string;
  title: string;
  lead: string | null;
  category: string | null;
  date: Date;
  hasVideo: boolean;
  /** `null` бол хуулийн төсөлгүй */
  billStage: number | null;
  tags: string[];
};

export type MenuChip = { key: ChipKey; label: string; icon: IconName; count: number };

export type TimeKey = "all" | "w" | "m" | "y";

/** artifact-ийн `CL` */
export const CHIP_LABELS: Record<string, string> = {
  all: "Бүгд",
  vid: "Видеотой",
  bill: "Хуулийн төсөл",
};

/** artifact-ийн `CI` */
const CHIP_ICONS: Record<string, IconName> = {
  all: "grid",
  vid: "play",
  bill: "file",
  Чуулган: "landmark",
  "Хуулийн мэдээ": "scale",
  "Байнгын хороо": "users",
  "Гадаад харилцаа": "globe",
  Нийгэм: "heart",
  Төсөв: "wallet",
  "Эдийн засаг": "trend",
  Видео: "video",
};

export function chipIcon(key: ChipKey): IconName {
  return CHIP_ICONS[key] ?? "tag";
}

/** artifact-ийн `#tflt` товчнууд */
export const TIME_FILTERS: { key: TimeKey; label: string }[] = [
  { key: "all", label: "Бүгд" },
  { key: "w", label: "7 хоног" },
  { key: "m", label: "30 хоног" },
  { key: "y", label: "Энэ жил" },
];

/** artifact-ийн `tmin` */
export const TIME_DAYS: Record<TimeKey, number> = { all: 0, w: 7, m: 30, y: 365 };

/**
 * «Видео» ангилал нь өөрийн чипгүй — «Видеотой» чип түүнийг бүрэн
 * орлоно (artifact: `.filter(c => c != 'Видео')`).
 */
const VIDEO_CATEGORY = "Видео";

function countFor(posts: MenuPost[], key: ChipKey): number {
  if (key === "all") return posts.length;
  if (key === "vid") return posts.filter((p) => p.hasVideo).length;
  if (key === "bill") return posts.filter((p) => p.billStage !== null).length;
  return posts.filter((p) => p.category === key).length;
}

/**
 * Чипүүд: `Бүгд` → ангиллууд → `Видеотой` → `Хуулийн төсөл`.
 *
 * Ангиллын дараалал нь тохиргооных (`order`), гэхдээ ЗӨВХӨН мэдээтэй нь.
 * Хоосон ангилалд чип гаргавал дарахад «Илэрц олдсонгүй» гарна — чип
 * бүр ядаж нэг мэдээ амлах ёстой.
 */
export function menuChips(posts: MenuPost[], order: string[]): MenuChip[] {
  const used = new Set(
    posts.map((p) => p.category).filter((c): c is string => Boolean(c) && c !== VIDEO_CATEGORY),
  );

  const ordered = order.filter((c) => used.has(c));
  const rest = [...used].filter((c) => !ordered.includes(c));
  const keys: ChipKey[] = ["all", ...ordered, ...rest, "vid", "bill"];

  return keys.map((key) => ({
    key,
    label: CHIP_LABELS[key] ?? key,
    icon: chipIcon(key),
    count: countFor(posts, key),
  }));
}

export type MenuFilter = { chip: ChipKey; time: TimeKey; q: string };

/** Хайлтын талбарууд — artifact: `n.t + n.l + n.c + n.k + tags` */
function haystack(post: MenuPost): string {
  return [post.title, post.lead ?? "", post.category ?? "", post.tags.join(" ")]
    .join(" ")
    .toLowerCase();
}

export function filterMenuPosts(
  posts: MenuPost[],
  filter: MenuFilter,
  now: Date = new Date(),
): MenuPost[] {
  const q = filter.q.trim().toLowerCase();
  const days = TIME_DAYS[filter.time] ?? 0;

  return posts.filter((post) => {
    if (filter.chip === "vid" && !post.hasVideo) return false;
    if (filter.chip === "bill" && post.billStage === null) return false;
    if (filter.chip !== "all" && filter.chip !== "vid" && filter.chip !== "bill") {
      if (post.category !== filter.chip) return false;
    }

    if (days > 0) {
      const age = (now.getTime() - post.date.getTime()) / 86_400_000;
      if (age > days) return false;
    }

    if (q && !haystack(post).includes(q)) return false;

    return true;
  });
}
