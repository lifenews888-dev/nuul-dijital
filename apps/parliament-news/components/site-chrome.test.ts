import { describe, it, expect } from "vitest";
import { headerModel, footerModel } from "./site-chrome";
import type { SettingOf } from "../lib/settings";

const cats = [
  { slug: "chuulgan", name: "Чуулган" },
  { slug: "video", name: "Видео" },
];

const header = (over: Partial<SettingOf<"header">> = {}): SettingOf<"header"> => ({
  pos: "left",
  size: 30,
  tagline: "",
  menu: "inline",
  ...over,
});

const footer = (over: Partial<SettingOf<"footer">> = {}): SettingOf<"footer"> => ({
  addr: "",
  phone: "",
  email: "",
  sales: "",
  about: "",
  policy: "",
  fb: "",
  yt: "",
  ig: "",
  x: "",
  ...over,
});

describe("headerModel", () => {
  it("цэсний ангиллыг /c/<slug> болгоно, нүүрийг эхэнд тавина", () => {
    expect(headerModel(header(), cats).items).toEqual([
      { href: "/", label: "Нүүр" },
      { href: "/c/chuulgan", label: "Чуулган" },
      { href: "/c/video", label: "Видео" },
    ]);
  });

  it("tagline ба зэрэгцүүлэлтийг дамжуулна", () => {
    const m = headerModel(
      header({ pos: "center", tagline: "Парламентын мэдээ", menu: "burger" }),
      cats,
    );
    expect(m.align).toBe("center");
    expect(m.tagline).toBe("Парламентын мэдээ");
    expect(m.menuMode).toBe("burger");
  });

  it("ангилал байхгүй бол зөвхөн нүүр", () => {
    expect(headerModel(header(), []).items).toEqual([{ href: "/", label: "Нүүр" }]);
  });

  it("логоны хэмжээг дамжуулна", () => {
    expect(headerModel(header({ size: 42 }), cats).logoScale).toBe(42);
  });
});

describe("footerModel", () => {
  it("зөвхөн бөглөсөн холбоо барих мөрийг гаргана", () => {
    const m = footerModel(footer({ addr: "Улаанбаатар", email: "a@b.mn" }));
    expect(m.contact).toEqual([
      { label: "Хаяг", value: "Улаанбаатар" },
      { label: "И-мэйл", value: "a@b.mn" },
    ]);
  });

  it("дөрвөн холбоо барих талбарыг тогтсон дарааллаар", () => {
    const m = footerModel(
      footer({ addr: "УБ", phone: "11-11", email: "a@b.mn", sales: "zar@b.mn" }),
    );
    expect(m.contact.map((c) => c.label)).toEqual([
      "Хаяг",
      "Утас",
      "И-мэйл",
      "Сурталчилгаа",
    ]);
  });

  it("хоосон сошиал холбоосыг гаргахгүй", () => {
    const m = footerModel(footer({ fb: "https://facebook.com/x" }));
    expect(m.socials).toEqual([{ kind: "fb", href: "https://facebook.com/x" }]);
  });

  it("дөрвөн сошиалыг тогтсон дарааллаар", () => {
    const m = footerModel(
      footer({
        fb: "https://facebook.com/x",
        yt: "https://youtube.com/x",
        ig: "https://instagram.com/x",
        x: "https://x.com/x",
      }),
    );
    expect(m.socials.map((s) => s.kind)).toEqual(["fb", "yt", "ig", "x"]);
  });

  // admin.html-д about нь 1500, policy нь 2000 тэмдэгтийн textarea —
  // холбоос биш, урт текст. Тиймээс footer-т текстийн блок болж гарна.
  it("about ба policy нь текстийн блок, холбоос биш", () => {
    const m = footerModel(footer({ about: "Бидний тухай", policy: "Нууцлалын бодлого" }));
    expect(m.texts).toEqual([
      { label: "Бидний тухай", body: "Бидний тухай" },
      { label: "Нууцлалын бодлого", body: "Нууцлалын бодлого" },
    ]);
  });

  it("бөглөөгүй бол текстийн блок гарахгүй", () => {
    expect(footerModel(footer()).texts).toEqual([]);
  });

  it("бүхэлдээ хоосон тохиргоонд ч унахгүй", () => {
    const m = footerModel(footer());
    expect(m.contact).toEqual([]);
    expect(m.socials).toEqual([]);
    expect(m.texts).toEqual([]);
  });
});
