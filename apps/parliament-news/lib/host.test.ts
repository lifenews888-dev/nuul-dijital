import { describe, it, expect } from "vitest";
import { parseHost, pickTenantHost, needsStudioAuth, tenantHostHeader } from "./host";
import { config } from "../middleware";

describe("parseHost", () => {
  it("домэйныг хэлбэржүүлнэ", () => {
    expect(parseHost("parlamentnews.mn")).toEqual({ kind: "domain", value: "parlamentnews.mn" });
    expect(parseHost("WWW.ParlamentNews.MN")).toEqual({ kind: "domain", value: "parlamentnews.mn" });
    expect(parseHost("parlamentnews.mn:3000")).toEqual({ kind: "domain", value: "parlamentnews.mn" });
    expect(parseHost("parlamentnews.mn.")).toEqual({ kind: "domain", value: "parlamentnews.mn" });
  });
  it("localhost дээрх subdomain-ыг tenant slug гэж үзнэ", () => {
    expect(parseHost("parlament.localhost:3001")).toEqual({ kind: "subdomain", value: "parlament" });
  });
  it("танихгүй оролтод unknown буцаана", () => {
    expect(parseHost(null)).toEqual({ kind: "unknown", value: null });
    expect(parseHost("")).toEqual({ kind: "unknown", value: null });
    expect(parseHost("localhost:3001")).toEqual({ kind: "unknown", value: null });
    expect(parseHost("127.0.0.1:3001")).toEqual({ kind: "unknown", value: null });
  });
});

describe("middleware matcher", () => {
  const re = new RegExp("^" + config.matcher[0] + "$");

  it("бүх хуудас, API, цэгтэй замыг хамарна", () => {
    expect(re.test("/")).toBe(true);
    expect(re.test("/news/tosov")).toBe(true);
    expect(re.test("/studio")).toBe(true);
    expect(re.test("/studio/posts")).toBe(true);
    expect(re.test("/api/trpc/health")).toBe(true);
    // tRPC-ийн nested procedure ба нийтийн feed — цэгтэй, хамрагдах ёстой
    expect(re.test("/api/trpc/news.list")).toBe(true);
    expect(re.test("/rss.xml")).toBe(true);
    expect(re.test("/sitemap.xml")).toBe(true);
  });

  it("Next-ийн дотоод файлыг хамрахгүй", () => {
    expect(re.test("/_next/static/chunk.js")).toBe(false);
  });
});

describe("pickTenantHost", () => {
  it("production-д клиентийн override-ыг үл хэрэгсэнэ", () => {
    expect(
      pickTenantHost({
        host: "parlamentnews.mn",
        override: "other-tenant.mn",
        allowOverride: false,
      }),
    ).toBe("parlamentnews.mn");
  });

  it("dev дээр override-ыг зөвшөөрнө", () => {
    expect(
      pickTenantHost({ host: "localhost:3001", override: "parlament", allowOverride: true }),
    ).toBe("parlament");
  });

  it("override байхгүй бол бодит host", () => {
    expect(
      pickTenantHost({ host: "parlamentnews.mn", override: null, allowOverride: true }),
    ).toBe("parlamentnews.mn");
    expect(pickTenantHost({ host: null, override: null, allowOverride: false })).toBeNull();
  });
});

describe("needsStudioAuth", () => {
  it("редакцын бүх зам нэвтрэлт шаардна", () => {
    expect(needsStudioAuth("/studio")).toBe(true);
    expect(needsStudioAuth("/studio/")).toBe(true);
    expect(needsStudioAuth("/studio/posts")).toBe(true);
    expect(needsStudioAuth("/studio/settings/team")).toBe(true);
  });

  it("зөвхөн signin хуудас нэвтрэлтгүй", () => {
    expect(needsStudioAuth("/studio/signin")).toBe(false);
    expect(needsStudioAuth("/studio/signin/callback")).toBe(false);
  });

  it("signin-тэй төстэй зам мултрахгүй", () => {
    expect(needsStudioAuth("/studio/signin-anything")).toBe(true);
    expect(needsStudioAuth("/studio/signinfoo")).toBe(true);
  });

  it("редакцын бус замд хамаарахгүй", () => {
    expect(needsStudioAuth("/")).toBe(false);
    expect(needsStudioAuth("/news/tosov")).toBe(false);
    expect(needsStudioAuth("/studiox")).toBe(false);
  });
});

describe("tenantHostHeader", () => {
  it("бодит host-ыг дамжуулна, parse хийхгүй", () => {
    expect(tenantHostHeader("Parlament.LocalHost:3005")).toBe("parlament.localhost:3005");
    expect(tenantHostHeader("parlamentnews.mn")).toBe("parlamentnews.mn");
    expect(tenantHostHeader(null)).toBeNull();
    expect(tenantHostHeader("  ")).toBeNull();
  });

  it("header-ийг дахин parse хийхэд ижил tenant гарах байх", () => {
    // middleware parse хийсэн утга тавивал ("parlament") Node тал нь
    // түүнииг unknown гэж үзнэ — tenant хэзээ ч олдохгүй
    expect(parseHost(tenantHostHeader("parlament.localhost:3005"))).toEqual({
      kind: "subdomain",
      value: "parlament",
    });
    expect(parseHost(tenantHostHeader("www.parlamentnews.mn:443"))).toEqual({
      kind: "domain",
      value: "parlamentnews.mn",
    });
  });
});
