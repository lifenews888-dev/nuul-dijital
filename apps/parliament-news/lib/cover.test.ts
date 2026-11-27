import { describe, it, expect } from "vitest";
import {
  COVER_W,
  COVER_H,
  PALETTES,
  isLight,
  palette,
  parseLook,
  wrapLines,
  motifSvg,
  coverSvg,
  coverInner,
  textureDefs,
  textureLayer,
  type CoverInput,
} from "./cover";

const MOTIFS = ["grid", "hemi", "cols", "bars", "rings", "sun", "wave"];

describe("хавтасны хэмжээ", () => {
  it("artifact-ийн 474×900", () => {
    expect([COVER_W, COVER_H]).toEqual([474, 900]);
  });
});

describe("isLight", () => {
  it("цайвар дэвсгэр", () => {
    expect(isLight("#F3F0EA")).toBe(true);
  });
  it("бараан дэвсгэр", () => {
    expect(isLight("#0A22E0")).toBe(false);
  });
  it("artifact-ийн хязгаар нь ЯГ > 150/1000", () => {
    // (r*299 + g*587 + b*114)/1000, коэффициентийн нийлбэр нь 1000 тул
    // саарал #969696 (150,150,150) нь яг 150.0 — «>» тул цайвар БИШ.
    expect(isLight("#969696")).toBe(false);
    expect(isLight("#979797")).toBe(true); // 151.0 > 150
  });
  it("хар, цагаан", () => {
    expect(isLight("#000000")).toBe(false);
    expect(isLight("#FFFFFF")).toBe(true);
  });
});

describe("palette", () => {
  it("theme нь PALETTES-ийн индекс", () => {
    expect(palette(0, null)).toEqual(["#0A22E0", "#F3F0EA", "#E86522"]);
    expect(palette(1, null)).toEqual(["#F3F0EA", "#0A22E0", "#E86522"]);
    expect(palette(2, null)).toEqual(["#E86522", "#F3F0EA", "#0A22E0"]);
  });
  it("PALETTES нь гурван палитр", () => {
    expect(PALETTES.length).toBe(3);
  });
  it("хүрээнээс гарсан theme → 0-р палитр", () => {
    expect(palette(9, null)).toEqual(["#0A22E0", "#F3F0EA", "#E86522"]);
    expect(palette(-1, null)).toEqual(["#0A22E0", "#F3F0EA", "#E86522"]);
  });
  it("look-ийн зөв hex нь палитрыг дарна", () => {
    expect(palette(0, { bg: "#112233" })).toEqual(["#112233", "#F3F0EA", "#E86522"]);
    expect(palette(0, { bg: "#112233", fg: "#445566", ac: "#778899" })).toEqual([
      "#112233",
      "#445566",
      "#778899",
    ]);
  });
  it("хүчингүй hex-ийг үл хэрэгсэнэ", () => {
    expect(palette(0, { bg: "red" })).toEqual(["#0A22E0", "#F3F0EA", "#E86522"]);
    expect(palette(0, { bg: "#FFF" })).toEqual(["#0A22E0", "#F3F0EA", "#E86522"]);
  });
});

describe("parseLook", () => {
  it("null, undefined, тоо, массив, мөр, boolean → null", () => {
    for (const v of [null, undefined, 5, "x", [], true]) {
      expect(parseLook(v)).toBeNull();
    }
  });
  it("танихгүй талбарыг хаяна", () => {
    expect(parseLook({ lay: "top", baahan: "<script>" })).toEqual({ lay: "top" });
  });
  it("хүчингүй утгыг хаяна, зөвийг авна", () => {
    expect(parseLook({ lay: "баахан", size: 1.1 })).toEqual({ size: 1.1 });
    expect(parseLook({ bg: "red", fg: "#112233" })).toEqual({ fg: "#112233" });
    expect(parseLook({ font: "comic" })).toEqual({});
  });
  it("size, fy нь тоо байх ёстой", () => {
    expect(parseLook({ size: "1.1" })).toEqual({});
    expect(parseLook({ fy: Number.NaN })).toEqual({});
    expect(parseLook({ fy: Number.POSITIVE_INFINITY })).toEqual({});
  });
  it("зөв бүрэн бүтцийг бүтнээр авна", () => {
    const look = {
      bg: "#112233",
      fg: "#445566",
      ac: "#778899",
      lay: "full",
      size: 1.1,
      font: "serif",
      fy: 20,
      duo: false,
    };
    expect(parseLook(look)).toEqual(look);
  });
  it("duo нь boolean байх ёстой", () => {
    expect(parseLook({ duo: "false" })).toEqual({});
    expect(parseLook({ duo: false })).toEqual({ duo: false });
  });
});

describe("wrapLines", () => {
  it("үгийн зааг дээр мөр хуваана", () => {
    expect(wrapLines("Чуулганы нэгдсэн хуралдаан хэлэлцэв", 13)).toEqual([
      "Чуулганы",
      "нэгдсэн",
      "хуралдаан",
      "хэлэлцэв",
    ]);
  });
  it("хамгийн ихдээ 5 мөр", () => {
    expect(wrapLines(Array(40).fill("үг").join(" "), 5).length).toBe(5);
  });
  it("нэг урт үгийг хүчээр хувааж мөрөөс гаргахгүй", () => {
    const out = wrapLines("а".repeat(60), 13);
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((l) => l.length <= 13)).toBe(true);
  });
  it("хоосон текст → хоосон массив", () => {
    expect(wrapLines("", 13)).toEqual([]);
    expect(wrapLines("   ", 13)).toEqual([]);
  });
  it("max-ийг дуудагч өөрчилж болно", () => {
    expect(wrapLines(Array(40).fill("үг").join(" "), 5, 2).length).toBe(2);
  });
});

describe("motifSvg", () => {
  it("7 хэлбэр тус бүр SVG буцаана", () => {
    for (const m of MOTIFS) {
      expect(motifSvg(m, "#F3F0EA", "#E86522").length).toBeGreaterThan(50);
    }
  });
  it("хэлбэрүүд хоорондоо адилхан биш", () => {
    const all = MOTIFS.map((m) => motifSvg(m, "#F3F0EA", "#E86522"));
    expect(new Set(all).size).toBe(7);
  });
  it("танихгүй хэлбэр нь grid болно", () => {
    expect(motifSvg("баахан", "#F3F0EA", "#E86522")).toBe(
      motifSvg("grid", "#F3F0EA", "#E86522"),
    );
  });
  it("өнгийг оролтоос авна, өөр өнгө гаргахгүй", () => {
    const s = motifSvg("bars", "#111111", "#222222");
    expect(s).toContain("#111111");
    expect(s).toContain("#222222");
  });
  it("нэг оролтод нэг л гаргалт — тогтвортой", () => {
    for (const m of MOTIFS) {
      expect(motifSvg(m, "#111111", "#222222")).toBe(motifSvg(m, "#111111", "#222222"));
    }
  });
});

describe("coverSvg", () => {
  const base: CoverInput = {
    title: "Төсвийн хэлэлцүүлэг",
    kicker: "ЧУУЛГАН",
    lead: "Товч агуулга",
    categoryName: "Төсөв",
    motif: "bars",
    theme: 0,
    look: null,
    imageUrl: null,
    featured: false,
  };

  it("474×900 viewBox-той бүтэн SVG", () => {
    const s = coverSvg(base);
    expect(s.startsWith("<svg")).toBe(true);
    expect(s).toContain('viewBox="0 0 474 900"');
    expect(s.endsWith("</svg>")).toBe(true);
  });

  it("coverInner нь coverSvg-ийн дотор агуулга", () => {
    expect(coverSvg(base)).toContain(coverInner(base));
  });

  it("гарчиг ба ангиллыг агуулна", () => {
    const s = coverSvg(base);
    expect(s).toContain("Төсөв");
    expect(s).toContain("Төсвийн");
  });

  it("зураггүй бол motif-оор эргэнэ", () => {
    const s = coverSvg(base);
    expect(s).toContain("<rect");
    expect(s).not.toContain("<image");
  });

  it("зурагтай бол image", () => {
    const s = coverSvg({ ...base, imageUrl: "https://ex.mn/a.jpg" });
    expect(s).toContain("<image");
    expect(s).toContain("https://ex.mn/a.jpg");
  });

  it("гарчигт байгаа SVG-д аюултай тэмдэгтийг escape хийнэ", () => {
    const s = coverSvg({ ...base, title: 'АН & МАН <script>alert("x")</script>' });
    expect(s).not.toContain("<script");
    expect(s).toContain("&amp;");
  });

  it("зургийн URL дахь хашилтыг escape хийнэ", () => {
    const s = coverSvg({ ...base, imageUrl: 'https://ex.mn/a.jpg" onload="x' });
    expect(s).not.toContain('onload="x"');
  });

  it("ангилал, lead-ийн тэмдэгтийг ч escape хийнэ", () => {
    const s = coverSvg({
      ...base,
      categoryName: "АН & МАН",
      lead: '<b>"lead"</b>',
      look: { lay: "text" },
    });
    expect(s).not.toContain("<b>");
    expect(s).toContain("&amp;");
  });

  it("200 тэмдэгтийн гарчиг 5 мөрөөс хэтрэхгүй", () => {
    const s = coverSvg({ ...base, title: "Үг ".repeat(70).trim() });
    const textLines = s.match(/<text[^>]*font-size="(4[0-9]|5[0-9]|6[0-9])"/g) ?? [];
    expect(textLines.length).toBeLessThanOrEqual(5);
  });

  it("featured бол шар тэмдэг", () => {
    expect(coverSvg({ ...base, featured: true })).toContain("#F9CF02");
    expect(coverSvg(base)).not.toContain("#F9CF02");
  });

  it("lay=text бол lead-ийг хавтсанд хэвлэнэ", () => {
    const s = coverSvg({ ...base, look: { lay: "text" } });
    expect(s).toContain("Товч агуулга");
  });

  it("size нь 0.8–1.25-д хавчигдана", () => {
    const small = coverSvg({ ...base, look: { size: 0.1 } });
    const big = coverSvg({ ...base, look: { size: 9 } });
    expect(small).toContain('font-size="35"'); // 44 * 0.8 = 35.2 -> 35
    expect(big).toContain('font-size="55"'); // 44 * 1.25 = 55
  });

  it("lead байхгүй, lay=text үед ч унахгүй", () => {
    const s = coverSvg({ ...base, lead: null, look: { lay: "text" } });
    expect(s).toContain('viewBox="0 0 474 900"');
  });

  it("гарчиг хоосон байсан ч хүчинтэй SVG", () => {
    const s = coverSvg({ ...base, title: "" });
    expect(s.startsWith("<svg")).toBe(true);
    expect(s.endsWith("</svg>")).toBe(true);
  });

  it("palette-ийн дэвсгэрийг дэвсгэр rect-д тавина", () => {
    expect(coverSvg({ ...base, theme: 2 })).toContain('fill="#E86522"');
  });
});

/**
 * Стори үзүүлэгчийн дэвсгэрт хавтас орохдоо ТЕКСТГҮЙ байх ёстой: давхарга
 * өөрөө гарчиг, ангилал, огноог дээр нь хэвлэдэг тул хавтасных давхарлаж,
 * хоёр гарчиг зөрөн уншигдахгүй болно.
 */
describe("coverInner — plain", () => {
  const input = {
    title: "Хөдөлмөрийн тухай хуульд нэмэлт",
    kicker: null,
    lead: "Товч агуулга",
    categoryName: "Хуулийн мэдээ",
    motif: "hemi",
    theme: 0,
    look: null,
    imageUrl: null,
    featured: true,
    date: new Date("2026-11-13T00:00:00Z"),
  };

  it("текстийн нэг ч хэсгийг зурахгүй", () => {
    const svg = coverInner({ ...input, plain: true });
    expect(svg).not.toContain("PARLAMENT NEWS");
    expect(svg).not.toContain("Хөдөлмөрийн");
    expect(svg).not.toContain("Хуулийн мэдээ");
    expect(svg).not.toContain("ОНЦЛОХ");
    expect(svg).not.toContain("2026.11.13");
    expect(svg).not.toContain("<text");
  });

  it("дэвсгэр ба хээ нь хэвээр", () => {
    const svg = coverInner({ ...input, plain: true });
    expect(svg).toContain(`width="474" height="900"`);
    expect(svg.length).toBeGreaterThan(100);
  });

  it("plain биш үед бүх текст байна", () => {
    const svg = coverInner(input);
    expect(svg).toContain("PARLAMENT NEWS");
    expect(svg).toContain("ОНЦЛОХ");
  });

  it("plain нь зурагтай хавтсанд ч ажиллана", () => {
    const svg = coverInner({ ...input, plain: true, imageUrl: "https://example.mn/a.jpg" });
    expect(svg).toContain("<image");
    expect(svg).not.toContain("<text");
  });
});

/**
 * Хэвлэмэл цаасны бодит бүтэц.
 *
 * Лавлагаа (`reference/vhs-archive.html`) нь гурван давхаргаар бодит мэт
 * болгодог: 220px-ийн `feTurbulence` үр тариа `mix-blend-mode:multiply`-аар,
 * гэрлийн градиент, гүн сүүдэр. Эхний хоёр нь ЗУРАГТ биш CSS-д байсан тул
 * `<img src="/cover/...">`-ээр гарах хавтсанд (нүүр, тэжээл, карт) хүрдэггүй.
 * Тиймээс энд SVG-ийн ДОТОР тавьсан — таван хэрэглэгч бүгд нэг адил харагдана.
 */
describe("хэвлэмэл бүтэц — textureDefs", () => {
  it("үр тариа ба бэхний толбо — хоёр давтамжит хээ", () => {
    const d = textureDefs();
    expect((d.match(/<pattern /g) ?? []).length).toBe(2);
    expect((d.match(/feTurbulence/g) ?? []).length).toBe(2);
  });

  it("үр тариа нь ТАСРАЛТГҮЙ хавтгайрна — хээний зааг харагдахгүй", () => {
    const d = textureDefs();
    expect((d.match(/stitchTiles="stitch"/g) ?? []).length).toBe(2);
    // filter-ийн муж нь хээний хэмжээтэй ЯГ тэнцэнэ, эс тэгвээс зааг гарна
    expect((d.match(/filterUnits="userSpaceOnUse"/g) ?? []).length).toBe(2);
  });

  /**
   * `feTurbulence` нь ӨНГӨ БОЛОН ТУНГАЛАГ дөрвүүлэнг нь санамсаргүй гаргадаг.
   * Тунгалагийг нь 1 болгож тогтоохгүй бол хээ нь толбо толбоор цоорч,
   * үр тариа биш, бохир шиг харагдана.
   */
  it("тунгалагийг 1 болгож тогтооно — зөвхөн гэрэлтүүлэг нь дуугарна", () => {
    expect((textureDefs().match(/0 0 0 0 1"/g) ?? []).length).toBe(2);
  });

  it("булангийн винет", () => {
    expect(textureDefs()).toContain("<radialGradient");
  });

  it("тогтвортой — нэг л гаргалт", () => {
    expect(textureDefs()).toBe(textureDefs());
  });
});

describe("хэвлэмэл бүтэц — textureLayer", () => {
  /**
   * ЗӨВХӨН `overlay`. `multiply` нь дарж, `screen` нь цайруулдаг — хоёулаа
   * гадаргууг саарал руу татна: #0A22E0 хөх нь бүдгэрч, #F3F0EA цаас нь
   * саарал болсон. `overlay` нь дунд саарал дээр ЮУ Ч ХИЙДЭГГҮЙ тул
   * дунджаараа 0 нөлөөтэй: гадаргуу л барзгарна, брэндийн өнгө хэвээр.
   */
  it("зөвхөн overlay — брэндийн өнгийг саарал руу татахгүй", () => {
    const l = textureLayer();
    expect((l.match(/mix-blend-mode:overlay/g) ?? []).length).toBe(2);
    expect(l).not.toContain("multiply");
    expect(l).not.toContain("screen");
  });

  /** Хэт хүчтэй бүтэц нь гарчгийг уншигдахгүй болгоно. */
  it("бүтцийн нийт хүч 0.3-аас хэтрэхгүй", () => {
    // зөвхөн хөшиг давхаргууд — `stroke-opacity` нь шугамынх, гадаргууг хардаггүй
    const sum = [...textureLayer().matchAll(/[^-]opacity="\.(\d+)"/g)].reduce(
      (a, m) => a + Number("0." + m[1]),
      0,
    );
    expect(sum).toBeLessThanOrEqual(0.3);
  });

  it("давхарга бүр хавтасны бүтэн хэмжээг дүүргэнэ", () => {
    const l = textureLayer();
    expect((l.match(/width="474" height="900"/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("хайчилсан хажуу — гэрэл тусах цаасны зузаан", () => {
    expect(textureLayer()).toContain("stroke");
  });

  it("бүтэц нь дарагдахгүй — pointer, aria-д оролцохгүй", () => {
    expect(textureLayer()).not.toContain("<text");
  });
});

describe("coverInner — бодит хэвлэлийн бүтэц", () => {
  const base: CoverInput = {
    title: "Төсвийн хэлэлцүүлэг",
    kicker: null,
    lead: "Товч агуулга",
    categoryName: "Төсөв",
    motif: "bars",
    theme: 0,
    look: null,
    imageUrl: null,
    featured: false,
  };

  it("хавтас бүрт бүтэц орно", () => {
    expect(coverInner(base)).toContain(textureLayer());
    expect(coverInner(base)).toContain(textureDefs());
  });

  it("бүтэц нь ТЕКСТИЙН ДАРАА — бэх цаасан дээр, цаас бэхэн дээр биш", () => {
    const svg = coverInner(base);
    expect(svg.indexOf(textureLayer())).toBeGreaterThan(svg.lastIndexOf("</text>"));
  });

  it("текстгүй хавтсанд ч бүтэц байна — стори нь мөн адил цаасан дээр", () => {
    const svg = coverInner({ ...base, plain: true });
    expect(svg).toContain(textureLayer());
    expect(svg).not.toContain("<text");
  });

  it("texture:false үед нэг ч давхарга гарахгүй", () => {
    const svg = coverInner({ ...base, texture: false });
    expect(svg).not.toContain("feTurbulence");
    expect(svg).not.toContain("mix-blend-mode");
    expect(svg).toContain("Төсвийн");
  });

  it("зурагтай хавтсанд duotone ба бүтэц НЭГ defs-д", () => {
    const svg = coverInner({ ...base, imageUrl: "https://ex.mn/a.jpg" });
    expect((svg.match(/<defs>/g) ?? []).length).toBe(1);
    expect(svg).toContain('type="saturate"');
    expect(svg).toContain("feTurbulence");
  });

  it("бүтэц нь ангиллын өнгийг гажуудуулахгүй — дэвсгэр rect хэвээр", () => {
    expect(coverInner({ ...base, theme: 2 })).toContain('fill="#E86522"');
  });
});
