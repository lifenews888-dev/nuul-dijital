import { describe, it, expect } from "vitest";
import { safeCallbackUrl, SIGNIN_DEFAULT } from "./signin";

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
