import { describe, it, expect } from "vitest";
import { SEATS, SESSION_STATUSES, safeLink } from "./live-input";
import { SEATS as HEMI } from "./hemicycle";

describe("SEATS", () => {
  /** Нүүрний хагас дугуйтай салбал суудал хэтэрч, зураг эвдэрнэ */
  it("нүүрний хагас дугуйтай ижил", () => {
    expect(SEATS).toBe(HEMI);
    expect(SEATS).toBe(126);
  });
});

describe("SESSION_STATUSES", () => {
  it("artifact-ийн дөрвөн төлөв", () => {
    expect(SESSION_STATUSES).toEqual([
      "Хуралдаж байна",
      "Завсарлага",
      "Хойшлуулсан",
      "Хуралдаан дууссан",
    ]);
  });
});

describe("safeLink", () => {
  it("http, https-ийг зөвшөөрнө", () => {
    expect(safeLink("https://parliament.mn/live")).toBe(true);
    expect(safeLink("http://parliament.mn/live")).toBe(true);
  });

  /** «ШУУД» товч нь нүүрний хамгийн тод элемент */
  it("javascript:, data:-г татгалзана", () => {
    expect(safeLink("javascript:alert(1)")).toBe(false);
    expect(safeLink("data:text/html,<script>")).toBe(false);
  });

  it("хоосон, тодорхойгүйг татгалзана", () => {
    expect(safeLink("")).toBe(false);
    expect(safeLink(undefined)).toBe(false);
    expect(safeLink(null)).toBe(false);
    expect(safeLink("   ")).toBe(false);
  });

  it("протоколгүй хаягийг татгалзана", () => {
    expect(safeLink("parliament.mn")).toBe(false);
    expect(safeLink("//parliament.mn")).toBe(false);
  });
});
