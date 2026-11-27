import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NewsRole } from "@nuul/db-news";
import { ROLE_LABELS, SECTIONS, FLOW } from "./permissions";
import { STATUS_LABELS } from "./studio-status";
import { ACTION_BUTTONS } from "./workflow-actions";

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
