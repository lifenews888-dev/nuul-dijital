import { describe, it, expect } from "vitest";
import { calendarUrl } from "./calendar";

const day = new Date("2026-11-26T00:00:00Z");

describe("calendarUrl", () => {
  it("Google-ийн загварын хаяг, УБ-ын бүсээр", () => {
    const url = new URL(calendarUrl("10:00", "Нэгдсэн хуралдаан", day));
    expect(url.origin + url.pathname).toBe(
      "https://calendar.google.com/calendar/render",
    );
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("ctz")).toBe("Asia/Ulaanbaatar");
  });

  it("гарчигт УИХ гэсэн угтвар", () => {
    const url = new URL(calendarUrl("10:00", "Нэгдсэн хуралдаан", day));
    expect(url.searchParams.get("text")).toBe("УИХ: Нэгдсэн хуралдаан");
  });

  it("нэг цаг үргэлжилнэ", () => {
    const url = new URL(calendarUrl("10:00", "Х", day));
    expect(url.searchParams.get("dates")).toBe("20261126T100000/20261126T110000");
  });

  it("шөнө дундын өмнөх цаг эргэлдэнэ, өдөр нь хэвээр", () => {
    const url = new URL(calendarUrl("23:30", "Х", day));
    expect(url.searchParams.get("dates")).toBe("20261126T233000/20261126T003000");
  });

  it("цаг буруу бичигдсэн бол 10:00", () => {
    const url = new URL(calendarUrl("—", "Х", day));
    expect(url.searchParams.get("dates")).toBe("20261126T100000/20261126T110000");
  });

  it("тусгай тэмдэгтүүдийг зугтаана", () => {
    const url = new URL(calendarUrl("09:05", "Төсөв & хууль", day));
    expect(url.searchParams.get("text")).toBe("УИХ: Төсөв & хууль");
  });
});
