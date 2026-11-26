import { describe, it, expect } from "vitest";
import { pageParams } from "./paging";

describe("pageParams", () => {
  it("анхдагч нь 1-р хуудас", () => {
    expect(pageParams(undefined, 12, 100)).toEqual({
      page: 1,
      skip: 0,
      take: 12,
      pages: 9,
    });
  });

  it("2-р хуудас", () => {
    expect(pageParams("2", 12, 100)).toMatchObject({ page: 2, skip: 12 });
  });

  it("хүрээнээс хэтэрсэн хуудас → эцсийн хуудас", () => {
    expect(pageParams("999", 12, 100)).toMatchObject({ page: 9, skip: 96 });
  });

  it("тоо биш, 0, сөрөг → 1-р хуудас", () => {
    for (const v of ["abc", "0", "-3", "1.5", "", "٣", "1e3"]) {
      expect(pageParams(v, 12, 100)).toMatchObject({ page: 1, skip: 0 });
    }
  });

  it("мэдээ байхгүй бол хуудас 1, pages 1", () => {
    expect(pageParams("3", 12, 0)).toEqual({ page: 1, skip: 0, take: 12, pages: 1 });
  });

  it("массив параметрийн эхнийхийг авна", () => {
    expect(pageParams(["2", "5"], 12, 100)).toMatchObject({ page: 2 });
  });

  it("яг нэг хуудас дүүрэх тоо нь хоёр дахь хуудас үүсгэхгүй", () => {
    expect(pageParams(undefined, 12, 12).pages).toBe(1);
    expect(pageParams(undefined, 12, 13).pages).toBe(2);
  });

  it("эцсийн хуудасны skip нь нийт тооноос хэтрэхгүй", () => {
    const p = pageParams("99", 12, 25);
    expect(p.pages).toBe(3);
    expect(p.skip).toBe(24);
    expect(p.skip).toBeLessThan(25);
  });

  it("take нь дамжуулсан хэмжээ хэвээр", () => {
    expect(pageParams("1", 24, 100).take).toBe(24);
  });
});
