import { describe, it, expect } from "vitest";
import { safeCallbackUrl, SIGNIN_DEFAULT, signinView } from "./signin";

/**
 * `callbackUrl` нь URL-ээс ирдэг тул ХЭРЭГЛЭГЧИЙН ХЯНАЛТАД байна.
 * Шалгалтгүй бол `/studio/signin?callbackUrl=https://evil.mn` гэсэн холбоос
 * нь парламентын домэйнаас гарсан, нэвтрэх формтой адил харагдах хуудас руу
 * хүнийг зөөнө — нээлттэй дахин чиглүүлэлт (open redirect), фишингийн
 * хамгийн хямд хэлбэр.
 *
 * Иймд цагаан дэвтэр: ЗӨВХӨН студийн доторх зам, бусад бүгд анхдагч.
 */
describe("safeCallbackUrl", () => {
  it("студийн зам хэвээр", () => {
    expect(safeCallbackUrl("/studio/news?status=review")).toBe("/studio/news?status=review");
    expect(safeCallbackUrl("/studio/news")).toBe("/studio/news");
    expect(safeCallbackUrl("/studio/news/abc123")).toBe("/studio/news/abc123");
  });

  it("гадны хаяг руу явуулахгүй", () => {
    expect(safeCallbackUrl("https://evil.mn/x")).toBe(SIGNIN_DEFAULT);
    expect(safeCallbackUrl("http://evil.mn/studio/news")).toBe(SIGNIN_DEFAULT);
    expect(safeCallbackUrl("//evil.mn/x")).toBe(SIGNIN_DEFAULT);
    expect(safeCallbackUrl("javascript:alert(1)")).toBe(SIGNIN_DEFAULT);
  });

  /** Хөтөч нь `\` -г `/` мэт уншина: `/\evil.mn` нь `//evil.mn` болно */
  it("тэртээ зураасыг ч барина", () => {
    expect(safeCallbackUrl("/\\evil.mn")).toBe(SIGNIN_DEFAULT);
    expect(safeCallbackUrl("/studio/news\\@evil.mn")).toBe(SIGNIN_DEFAULT);
  });

  it("нийтийн хуудас руу явуулахгүй — студи биш", () => {
    expect(safeCallbackUrl("/news/aliv")).toBe(SIGNIN_DEFAULT);
    expect(safeCallbackUrl("/")).toBe(SIGNIN_DEFAULT);
  });

  /** `/studioxyz` нь `/studio`-ийн доторх зам БИШ */
  it("зам нь заагаар таарна", () => {
    expect(safeCallbackUrl("/studioxyz/news")).toBe(SIGNIN_DEFAULT);
    expect(safeCallbackUrl("/studio")).toBe(SIGNIN_DEFAULT);
  });

  it("нэвтрэх хуудас руу гогцоо үүсгэхгүй", () => {
    expect(safeCallbackUrl("/studio/signin")).toBe(SIGNIN_DEFAULT);
    expect(safeCallbackUrl("/studio/signin?callbackUrl=/studio/news")).toBe(SIGNIN_DEFAULT);
  });

  it("дээш гарах замыг барина", () => {
    expect(safeCallbackUrl("/studio/../news")).toBe(SIGNIN_DEFAULT);
  });

  /**
   * `%2e%2e` нь WHATWG-ийн URL дүрмээр `..`-тай ЯГ адил: хөтөч
   * `/studio/%2e%2e/%2e%2e/evil` -ийг `/evil` болгож шийднэ. Домэйн
   * солигдохгүй тул нээлттэй дахин чиглүүлэлт БИШ, гэхдээ «зөвхөн
   * студийн доторх зам» гэсэн гэрээг зөрчинө.
   */
  it("кодлогдсон цэгийг ч барина", () => {
    expect(safeCallbackUrl("/studio/%2e%2e/%2e%2e/evil?x")).toBe(SIGNIN_DEFAULT);
    expect(safeCallbackUrl("/studio/%2E%2E/evil")).toBe(SIGNIN_DEFAULT);
  });

  it("кодлогдсон зураасыг ч барина", () => {
    expect(safeCallbackUrl("/studio/%2fevil")).toBe(SIGNIN_DEFAULT);
    expect(safeCallbackUrl("/studio/%5cevil")).toBe(SIGNIN_DEFAULT);
  });

  it("хоосон бол анхдагч", () => {
    expect(safeCallbackUrl(null)).toBe(SIGNIN_DEFAULT);
    expect(safeCallbackUrl(undefined)).toBe(SIGNIN_DEFAULT);
    expect(safeCallbackUrl("")).toBe(SIGNIN_DEFAULT);
    expect(safeCallbackUrl("   ")).toBe(SIGNIN_DEFAULT);
  });

  it("анхдагч нь өөрөө зөвшөөрөгдсөн зам", () => {
    expect(safeCallbackUrl(SIGNIN_DEFAULT)).toBe(SIGNIN_DEFAULT);
  });
});

/**
 * Хяналтын #3 — нэвтэрсэн ч редакцын гишүүн БИШ хүн.
 *
 * Хаалга нь түүнийг нэвтрэх хуудас руу шиднэ (тэр нь зөв). Гэтэл тэнд
 * хоосон форм зурагдвал тэр нь БУРУУ нууц үгтэй яг адил харагдана:
 * хүн зөв нууц үгээ дахин дахин бичиж, «нууц үг ажиллахаа больсон» гэж
 * мэдэгдэнэ, ерөнхий редактор сайн байсан нууц үгийг сэргээнэ. Гарах
 * товч нь тэр хүн хүрч чадахгүй самбарт байдаг тул гацна.
 *
 * `TenantMember.active` нь `false` болсон хүн яг ийм төлөвт унана —
 * код нь тэр төлөвийг мэддэг (`studio-session.db.test.ts`).
 */
describe("signinView", () => {
  it("нэвтрээгүй хүнд форм", () => {
    expect(signinView({ signedIn: false, hasStudio: false })).toBe("form");
  });

  it("нэвтэрсэн ба эрхтэй бол студи рүү", () => {
    expect(signinView({ signedIn: true, hasStudio: true })).toBe("redirect");
  });

  it("нэвтэрсэн ч эрхгүй бол ТАЙЛБАР, форм биш", () => {
    expect(signinView({ signedIn: true, hasStudio: false })).toBe("no-access");
  });

  /** Логикийн хувьд боломжгүй, гэхдээ чимээгүй форм үзүүлэхээс дээр */
  it("эрхтэй ч нэвтрээгүй гэж тооцвол студи рүү", () => {
    expect(signinView({ signedIn: false, hasStudio: true })).toBe("redirect");
  });
});
