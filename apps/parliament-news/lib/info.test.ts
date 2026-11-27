import { describe, it, expect } from "vitest";
import {
  CURRENCY_SYMBOL,
  WEATHER_ICON,
  FX_MAX,
  TICKER_FX,
  validFx,
  mnNumber,
  changeOf,
  weatherView,
} from "./info";

describe("validFx", () => {
  const row = (code: string, value: number, change = 0) => ({ code, value, change });

  it("зөвхөн гурван том үсэгтэй код", () => {
    const got = validFx([row("USD", 3450), row("usd", 1), row("US", 1), row("USDT", 1)]);
    expect(got.map((r) => r.code)).toEqual(["USD"]);
  });

  it("тоо биш утгыг хаяна", () => {
    expect(validFx([row("USD", Number.NaN), row("EUR", Number.POSITIVE_INFINITY)])).toEqual([]);
  });

  it("дээд тал нь зургаа", () => {
    const many = ["USD", "EUR", "CNY", "RUB", "KRW", "JPY", "GBP", "CHF"].map((c) => row(c, 1));
    expect(validFx(many)).toHaveLength(FX_MAX);
  });

  it("дарааллыг хадгална", () => {
    expect(validFx([row("EUR", 2), row("USD", 1)]).map((r) => r.code)).toEqual(["EUR", "USD"]);
  });

  it("гүйдэг мөр гурвыг л харуулна", () => {
    expect(TICKER_FX).toBe(3);
  });
});

describe("mnNumber", () => {
  it("мянгатын тусгаарлагчтай", () => {
    expect(mnNumber(3450)).toMatch(/3.450/);
  });

  it("хоёроос илүү аравтын орон гаргахгүй", () => {
    expect(mnNumber(1.23456)).toBe("1.23");
  });
});

describe("changeOf", () => {
  it("тэг нь тэмдэггүй — өөрчлөгдөөгүйд сум зурах нь худал", () => {
    expect(changeOf(0)).toBeNull();
  });

  it("өсөлт", () => {
    expect(changeOf(12.5)).toEqual({ dir: "up", text: "12.5" });
  });

  it("бууралт нь ҮНЭМЛЭХҮЙ утгаар — сум нь чиглэлийг хэлнэ", () => {
    expect(changeOf(-12.5)).toEqual({ dir: "dn", text: "12.5" });
  });

  it("тоо биш нь тэмдэггүй", () => {
    expect(changeOf(Number.NaN)).toBeNull();
  });
});

describe("weatherView", () => {
  it("null нь null", () => {
    expect(weatherView(null)).toBeNull();
  });

  it("температур нь бүхэл болно", () => {
    expect(weatherView({ city: "Улаанбаатар", t: -12.6, icon: "snow", text: "Цасласан" })).toEqual({
      icon: "snow",
      temp: -13,
      city: "Улаанбаатар",
      text: "Цасласан",
    });
  });

  it("хоосон хот нь Улаанбаатар", () => {
    expect(weatherView({ city: "", t: 0, icon: "sun", text: "" })?.city).toBe("Улаанбаатар");
  });

  it("танихгүй тэмдэг нь термометр", () => {
    expect(weatherView({ city: "A", t: 1, icon: "хакер", text: "" })?.icon).toBe("thermo");
  });

  it("температур тоо биш бол цаг агаар ГАРАХГҮЙ", () => {
    expect(weatherView({ city: "A", t: Number.NaN, icon: "sun", text: "" })).toBeNull();
  });
});

describe("тогтмолууд", () => {
  it("валютын тэмдэг", () => {
    expect(CURRENCY_SYMBOL.USD).toBe("$");
    expect(CURRENCY_SYMBOL.ZZZ).toBeUndefined();
  });

  it("artifact-ийн тэмдгийн зураглал: cloud→cloudsun, over→cloud", () => {
    expect(WEATHER_ICON.cloud).toBe("cloudsun");
    expect(WEATHER_ICON.over).toBe("cloud");
  });
});
