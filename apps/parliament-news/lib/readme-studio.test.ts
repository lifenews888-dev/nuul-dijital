import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NewsRole } from "@nuul/db-news";
import { ROLE_LABELS, SECTIONS, FLOW } from "./permissions";
import { STATUS_LABELS } from "./studio-status";
import { ACTION_BUTTONS } from "./workflow-actions";
import { LIMITS } from "./studio-post-input";
import { IMAGE_TYPES, IMAGE_MAX, VIDEO_MAX } from "./upload";
import { LOOK_PRESETS, MOTIF_CHOICES } from "./look-presets";

/**
 * Баримтжуулалт нь кодоос ТАСРАХГҮЙ байх.
 *
 * Эрхийн хүснэгт нь README-д байгаа гол шалтгаан нь: шинэ редактор
 * «надад яагаад энэ товч харагдахгүй байна?» гэж асуухад хариулт
 * нэг л газраас гарах ёстой. Код дээр үүрэг нэмээд README-г мартвал
 * тэр хариулт ХУДАЛ болно — хуудас нь баримт бичиг шиг харагдсаар,
 * гэтэл систем өөрөөр ажиллана.
 */
const app = dirname(dirname(fileURLToPath(import.meta.url)));
const readme = readFileSync(join(app, "README.md"), "utf8");

const ALL_ROLES = Object.keys(ROLE_LABELS) as NewsRole[];

describe("README-ийн студийн хэсэг", () => {
  it("нэвтрэх замыг хэлнэ", () => {
    expect(readme).toContain("/studio/signin");
  });

  it("хэрэглэгч нэмэх командыг хэлнэ", () => {
    expect(readme).toContain("db:seed:member");
    expect(readme).toContain("MEMBER_EMAIL");
  });

  it("арван үүрэг бүгд нэрээрээ бий", () => {
    for (const role of ALL_ROLES) {
      expect(readme, `${role} (${ROLE_LABELS[role].name}) README-д алга`).toContain(
        ROLE_LABELS[role].name,
      );
    }
    expect(ALL_ROLES).toHaveLength(10);
  });

  it("үүрэг бүрийн enum нэр ч бий — кодтой холбох гүүр", () => {
    for (const role of ALL_ROLES) {
      expect(readme, `${role} README-д алга`).toContain(role);
    }
  });

  it("таван төлөвийн шошго бий", () => {
    for (const label of Object.values(STATUS_LABELS)) {
      expect(readme, `«${label}» README-д алга`).toContain(label);
    }
  });

  it("урсгалын мөр нь FLOW-ийн дарааллаар", () => {
    const flow = FLOW.map((f) => f.label).join(" → ");
    expect(readme).toContain(flow);
  });

  it("таван үйлдэл бүгд нэрлэгдсэн", () => {
    for (const action of Object.keys(ACTION_BUTTONS)) {
      expect(readme, `${action} README-д алга`).toContain(action);
    }
  });

  /** Юу засаж чадахыг нь хүснэгтээс уншиж болох ёстой */
  it("хэсгүүдийн нэрс бий", () => {
    for (const section of SECTIONS.SUPER) {
      expect(readme, `${section} README-д алга`).toContain(section);
    }
  });

  it("эрх нь серверт шалгагддагийг хэлнэ", () => {
    expect(readme).toMatch(/товч нуух нь хамгаалалт биш/i);
  });
});

/**
 * Засварлагчийн баримт нь кодоос тасрахгүй байх.
 *
 * Хязгаарыг кодод өөрчлөөд README-г мартвал редактор «160 тэмдэгт» гэж
 * уншаад 200 бичиж, сервер татгалзахад яагаад гэдгийг ойлгохгүй.
 */
describe("README-ийн засварлагчийн хэсэг", () => {
  it("замуудыг хэлнэ", () => {
    expect(readme).toContain("/studio/news/new");
    expect(readme).toContain("/studio/news/<id>");
  });

  it("талбаруудын хязгаар кодтой таарна", () => {
    for (const n of [LIMITS.title, LIMITS.kicker, LIMITS.lead, LIMITS.body, LIMITS.sources]) {
      expect(readme, `${n} README-д алга`).toContain(String(n));
    }
  });

  it("байршуулалтын хязгаар кодтой таарна", () => {
    expect(readme).toContain(String(Math.round(IMAGE_MAX / (1024 * 1024))));
    expect(readme).toContain(String(Math.round(VIDEO_MAX / (1024 * 1024))));
  });

  /** SVG-г яагаад хориглосныг хэлэх нь дүрмийг өөрийг нь хэлэхээс чухал */
  it("SVG хориотойг шалтгаантай нь хэлнэ", () => {
    expect(readme).toMatch(/SVG зөвшөөрөгдөхгүй/);
    expect(readme).toMatch(/script/i);
  });

  /** README нь брэндийн бичлэгээр бичнэ («WebP»), тиймээс том жижгийг үл ялгана */
  it("зөвшөөрөгдсөн зургийн төрлүүд", () => {
    const lower = readme.toLowerCase();
    for (const t of IMAGE_TYPES) {
      const name = t.split("/")[1];
      expect(lower, `${name} README-д алга`).toContain(name);
    }
  });

  it("нийтлэгдсэн мэдээний хаяг хөдлөхгүйг хэлнэ", () => {
    expect(readme).toMatch(/хаяг ХЭЗЭЭ Ч хөдлөхгүй/);
  });

  it("зэрэгцээ засварлалтыг хэлнэ", () => {
    expect(readme).toContain("updatedAt");
  });

  it("дизайн мастерын бэлэн загварууд", () => {
    for (const p of LOOK_PRESETS.slice(0, 3)) {
      expect(readme, `${p.name} README-д алга`).toContain(String(LOOK_PRESETS.length));
    }
    expect(readme).toContain(String(MOTIF_CHOICES.length));
  });

  it("ороогүй зүйлсийг шалтгаантай нь жагсаана", () => {
    expect(readme).toContain("Сошиал постын текст");
    expect(readme).toContain("Tiptap");
    expect(readme).toMatch(/Anthropic API/);
  });
});
