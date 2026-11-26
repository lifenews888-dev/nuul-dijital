import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * `app/artifact.css` нь ҮҮСГЭГДСЭН файл (`scripts/extract-artifact-css.mjs`).
 * Artifact-ийн зарим ӨРГӨН дүрэм нь тэнд байсан DOM/JS-ийг шаарддаг —
 * бид түүнийг портлоогүй бол нөхөх дүрэм `globals.css`-д байх ЁСТОЙ.
 *
 * Эдгээр тест нь дахин задлахад (эсвэл artifact шинэчлэгдэхэд) нөхөлт
 * мартагдвал улаан болно.
 */
const app = join(__dirname, "..");
const artifact = readFileSync(join(app, "app/artifact.css"), "utf8");
const globals = readFileSync(join(app, "app/globals.css"), "utf8");

describe("фонтын гэр бүлийн нэрс", () => {
  /**
   * next/font нь гэр бүлийн нэрийг hash-даг (`__Inter_Tight_2dee46`) ба
   * зөвхөн CSS хувьсагчаар гаргадаг. Artifact-ийн бичсэн `"Inter Tight"`
   * нь ХЭЗЭЭ Ч ачаалагдахгүй: зочны компьютерт тэр фонт сууснаас л
   * хамаарна. 47 мэдэгдэлд ерөнхий fallback ч алга (`font: 600 8px/1.15
   * "Inter Tight"`) — тэд хөтчийн анхдагч (Times) руу унана.
   */
  it("artifact.css нь шууд нэрээр фонт дуудахгүй", () => {
    expect(artifact).not.toContain('"Inter Tight"');
    expect(artifact).not.toContain('"Noto Serif"');
    expect(artifact).not.toContain('"PT Serif"');
    expect(artifact).not.toContain("'Inter Tight'");
    expect(artifact).not.toContain("'Noto Serif'");
    expect(artifact).not.toContain("'PT Serif'");
  });

  it("оронд нь next/font-ийн хувьсагчаар", () => {
    expect(artifact).toContain("var(--font-head)");
    expect(artifact).toContain("var(--font-body)");
    expect(artifact).toContain("var(--font-title)");
  });
});

describe("өргөн дүрмүүдийн нөхөлт", () => {
  /**
   * Artifact нь өөрийн курсор зурдаг (`<div class="cur">` + rAF). Бид
   * түүнийг портлоогүй тул `cursor:none` нь ХУЛГАНЫГ БҮХ ХУУДСАНД
   * алга болгоно — зөвхөн өөрийн `cursor:pointer`-тэй элементүүд дээр
   * анивчиж харагдана.
   */
  it("cursor:none-г нөхсөн", () => {
    expect(artifact).toContain("cursor:none");
    expect(globals).toMatch(/cursor:\s*auto/);
    expect(globals).toMatch(/cursor:\s*pointer/);
  });

  /**
   * Artifact нь `body{user-select:none}` тавиад зөвхөн ӨӨРИЙН савнуудад
   * (`.menu`, `.feed`, `.sfoot`, `.detail`, `.pgb`) буцаан нээдэг.
   * 2-р шатны хуудсууд (нийтлэл, ангилал, хайлт, таг) тэдний алинд ч
   * биш — уншигч өгүүлбэр хуулж чадахгүй.
   */
  it("user-select:none-г нөхсөн", () => {
    expect(artifact).toContain("user-select:none");
    expect(globals).toMatch(/user-select:\s*text/);
  });

  /**
   * `.m.ct>span`-ийн мөрийн таслалт зөвхөн утас ба намхан дэлгэцийн
   * media block-д байдаг. Өргөн дэлгэцэд 130 тэмдэгтийн гарчиг (монгол
   * хуулийн гарчигт энгийн) цагийн шугам, хөлийг дарна.
   */
  it("гарчгийн мөрийн таслалт бүх өргөнд", () => {
    expect(globals).toMatch(/line-clamp/);
  });
});
