import { describe, it, expect } from "vitest";
import { newsAuthSecret, COOKIE_PREFIX, cookieName } from "./auth-env";

/**
 * Редакцын сесс нь nuul.mn-ийн сессээс ТУСДАА байх ёстой.
 *
 * Хоёр апп нэг `NEXTAUTH_SECRET` хуваалцвал nuul.mn-д гаргасан JWT нь
 * парламентын `middleware`-ийн `getToken()`-д ХҮЧИНТЭЙ болно. Үүрэг нь
 * `TenantMember`-ээс шалгагддаг тул эрх шууд олдохгүй ч, нэг аппын
 * токеныг нөгөөд таниулах нь хамгаалалтын хил эвдэх юм: түлхүүр
 * нэгэнт нийтлэг бол аль нэг аппын гоожилт хоёуланг нь онгойлгоно.
 */
describe("newsAuthSecret", () => {
  it("өөрийн түлхүүрийг авна", () => {
    expect(newsAuthSecret({ NEWS_NEXTAUTH_SECRET: "парламент" })).toBe("парламент");
  });

  it("nuul.mn-ийн түлхүүртэй ИЖИЛ бол шиднэ", () => {
    expect(() =>
      newsAuthSecret({ NEWS_NEXTAUTH_SECRET: "ижил", NEXTAUTH_SECRET: "ижил" }),
    ).toThrow(/ӨӨР/);
  });

  it("хоосон зайг тоохгүй — хоосон нь тавиагүйтэй адил", () => {
    expect(newsAuthSecret({ NEWS_NEXTAUTH_SECRET: "   " })).toBeUndefined();
    expect(newsAuthSecret({})).toBeUndefined();
  });

  /** Хөгжүүлэлтэд тавиагүй байж болно — апп дуудахгүй, зөвхөн сануулна */
  it("хөгжүүлэлтэд тавиагүй бол undefined", () => {
    expect(newsAuthSecret({ NODE_ENV: "development" })).toBeUndefined();
  });

  /**
   * Production-д ЧИМЭЭГҮЙ унах нь хамгийн дор: nuul.mn-ийн түлхүүрээр
   * ажиллаад, хэн ч мэдэхгүй. Иймд build/ажиллуулалт зогсоно.
   */
  it("production-д тавиагүй бол шиднэ", () => {
    expect(() => newsAuthSecret({ NODE_ENV: "production" })).toThrow(/NEWS_NEXTAUTH_SECRET/);
  });

  it("production-д өөрийн түлхүүртэй бол ажиллана", () => {
    expect(newsAuthSecret({ NODE_ENV: "production", NEWS_NEXTAUTH_SECRET: "өөрийн" })).toBe(
      "өөрийн",
    );
  });
});

describe("cookieName", () => {
  it("парламентын өөрийн угтвартай", () => {
    expect(cookieName("session-token", false)).toBe(`${COOKIE_PREFIX}session-token`);
  });

  /** https дээр хөтөч `__Secure-` угтвартай cookie-г л аюулгүй гэж тооцно */
  it("https дээр __Secure- угтвар нэмнэ", () => {
    expect(cookieName("session-token", true)).toBe(`__Secure-${COOKIE_PREFIX}session-token`);
  });

  it("nuul.mn-ийн анхдагч нэртэй давхцахгүй", () => {
    expect(cookieName("session-token", false)).not.toBe("next-auth.session-token");
    expect(cookieName("csrf-token", true)).not.toBe("__Host-next-auth.csrf-token");
  });
});
