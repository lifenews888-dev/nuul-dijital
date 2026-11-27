import { describe, it, expect } from "vitest";
import {
  TIME_FILTERS,
  TIME_DAYS,
  CHIP_LABELS,
  chipIcon,
  menuChips,
  filterMenuPosts,
  type MenuPost,
} from "./menu-filter";

/**
 * Цэсний шүүлт — artifact-ийн `renderRes()` (index.html:952-963).
 *
 * Эдгээрийг компонентод шууд бичвэл тест хүрэхгүй: алдаа нь яг энд
 * (тоолол, хугацааны хил, «Видеотой»/«Хуулийн төсөл» гэсэн тусгай чип)
 * гардаг.
 */
const post = (p: Partial<MenuPost> = {}): MenuPost => ({
  slug: "s",
  title: "Гарчиг",
  lead: "Тойм",
  category: "Чуулган",
  date: new Date("2026-11-20T00:00:00Z"),
  hasVideo: false,
  billStage: null,
  tags: [],
  ...p,
});

const now = new Date("2026-11-27T12:00:00Z");
const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000);

describe("CHIP_LABELS", () => {
  it("artifact-ийн `CL` хүснэгт", () => {
    expect(CHIP_LABELS.all).toBe("Бүгд");
    expect(CHIP_LABELS.vid).toBe("Видеотой");
    expect(CHIP_LABELS.bill).toBe("Хуулийн төсөл");
  });
});

describe("chipIcon", () => {
  it("artifact-ийн `CI` хүснэгт", () => {
    expect(chipIcon("all")).toBe("grid");
    expect(chipIcon("vid")).toBe("play");
    expect(chipIcon("bill")).toBe("file");
    expect(chipIcon("Чуулган")).toBe("landmark");
    expect(chipIcon("Хуулийн мэдээ")).toBe("scale");
    expect(chipIcon("Байнгын хороо")).toBe("users");
    expect(chipIcon("Гадаад харилцаа")).toBe("globe");
    expect(chipIcon("Нийгэм")).toBe("heart");
    expect(chipIcon("Төсөв")).toBe("wallet");
    expect(chipIcon("Эдийн засаг")).toBe("trend");
    expect(chipIcon("Видео")).toBe("video");
  });

  it("танихгүй ангилалд шошгоны тэмдэг", () => {
    expect(chipIcon("Спорт")).toBe("tag");
  });
});

describe("menuChips", () => {
  const posts = [
    post({ slug: "a", category: "Чуулган" }),
    post({ slug: "b", category: "Төсөв", hasVideo: true }),
    post({ slug: "c", category: "Төсөв", billStage: 2 }),
    post({ slug: "d", category: "Видео", hasVideo: true }),
  ];

  it("«Бүгд» нь эхэнд, нийт тоотой", () => {
    const chips = menuChips(posts, ["Чуулган", "Төсөв"]);
    expect(chips[0]).toMatchObject({ key: "all", label: "Бүгд", count: 4 });
  });

  it("«Видеотой», «Хуулийн төсөл» нь төгсгөлд", () => {
    const chips = menuChips(posts, ["Чуулган", "Төсөв"]);
    const keys = chips.map((c) => c.key);
    expect(keys.slice(-2)).toEqual(["vid", "bill"]);
    expect(chips.find((c) => c.key === "vid")?.count).toBe(2);
    expect(chips.find((c) => c.key === "bill")?.count).toBe(1);
  });

  it("ангиллын дараалал нь тохиргооных", () => {
    const chips = menuChips(posts, ["Төсөв", "Чуулган"]);
    expect(chips.map((c) => c.key).slice(1, 3)).toEqual(["Төсөв", "Чуулган"]);
  });

  /** artifact: `filter(c => used.has(c))` — хоосон ангилал чип авахгүй */
  it("мэдээгүй ангилал чип авахгүй", () => {
    const chips = menuChips(posts, ["Чуулган", "Төсөв", "Спорт"]);
    expect(chips.map((c) => c.key)).not.toContain("Спорт");
  });

  /**
   * artifact: `.filter(c => c != 'Видео')` — «Видео» ангилал нь өөрийн
   * чипгүй, учир нь «Видеотой» чип түүнийг бүрэн орлоно.
   */
  it("«Видео» ангилал давхар чип үүсгэхгүй", () => {
    const chips = menuChips(posts, ["Чуулган", "Төсөв", "Видео"]);
    expect(chips.map((c) => c.key)).not.toContain("Видео");
  });

  it("тохиргоонд байхгүй ч мэдээтэй ангилал орно", () => {
    const chips = menuChips(posts, []);
    expect(chips.map((c) => c.key)).toContain("Чуулган");
    expect(chips.map((c) => c.key)).toContain("Төсөв");
  });

  it("ангилал бүрийн тоо", () => {
    const chips = menuChips(posts, ["Төсөв"]);
    expect(chips.find((c) => c.key === "Төсөв")?.count).toBe(2);
  });
});

describe("TIME_FILTERS", () => {
  it("artifact-ийн дөрвөн хугацаа", () => {
    expect(TIME_FILTERS.map((t) => t.key)).toEqual(["all", "w", "m", "y"]);
    expect(TIME_FILTERS.map((t) => t.label)).toEqual(["Бүгд", "7 хоног", "30 хоног", "Энэ жил"]);
  });

  it("өдрийн тоо нь artifact-ийнх", () => {
    expect(TIME_DAYS).toEqual({ all: 0, w: 7, m: 30, y: 365 });
  });
});

describe("filterMenuPosts", () => {
  const posts = [
    post({ slug: "chuulgan", category: "Чуулган", title: "Төсвийн хэлэлцүүлэг" }),
    post({ slug: "video", category: "Нийгэм", hasVideo: true, title: "Ярилцлага" }),
    post({ slug: "bill", category: "Хуулийн мэдээ", billStage: 3, title: "Хуулийн төсөл" }),
    post({ slug: "old", category: "Чуулган", title: "Хуучин", date: daysAgo(200) }),
    post({ slug: "week", category: "Чуулган", title: "Саяхан", date: daysAgo(3) }),
  ];
  const run = (over: Partial<Parameters<typeof filterMenuPosts>[1]> = {}) =>
    filterMenuPosts(posts, { chip: "all", time: "all", q: "", ...over }, now).map((p) => p.slug);

  it("шүүлтгүй бол бүгд", () => {
    expect(run()).toHaveLength(5);
  });

  it("ангиллаар", () => {
    expect(run({ chip: "Чуулган" })).toEqual(["chuulgan", "old", "week"]);
  });

  it("«Видеотой» нь видеотойг нь", () => {
    expect(run({ chip: "vid" })).toEqual(["video"]);
  });

  it("«Хуулийн төсөл» нь шаттайг нь", () => {
    expect(run({ chip: "bill" })).toEqual(["bill"]);
  });

  it("хугацаагаар — 7 хоног", () => {
    expect(run({ time: "w" })).toEqual(["week"]);
  });

  it("хугацаагаар — энэ жил нь 200 хоногийнхыг оруулна", () => {
    expect(run({ time: "y" })).toContain("old");
  });

  it("30 хоног нь 200 хоногийнхыг хасна", () => {
    expect(run({ time: "m" })).not.toContain("old");
  });

  it("гарчгаар хайна, том жижиг үсэг үл ялгана", () => {
    expect(run({ q: "ТӨСВИЙН" })).toEqual(["chuulgan"]);
  });

  it("тойм, ангилал, шошгоор ч хайна", () => {
    const withTag = [post({ slug: "t", tags: ["сонгууль"], title: "Юу ч биш" })];
    expect(filterMenuPosts(withTag, { chip: "all", time: "all", q: "сонгууль" }, now)).toHaveLength(
      1,
    );
    expect(
      filterMenuPosts(withTag, { chip: "all", time: "all", q: "Юу ч биш" }, now),
    ).toHaveLength(1);
  });

  it("шүүлтүүд хоорондоо нийлнэ", () => {
    expect(run({ chip: "Чуулган", time: "w" })).toEqual(["week"]);
  });

  it("илэрцгүй бол хоосон", () => {
    expect(run({ q: "байхгүй үг" })).toEqual([]);
  });

  it("хоосон зайтай хайлтыг тоохгүй", () => {
    expect(run({ q: "   " })).toHaveLength(5);
  });
});
