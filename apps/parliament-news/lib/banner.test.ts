import { describe, it, expect } from "vitest";
import { visibleBanners, bannerKind, type BannerRow } from "./banner";

const NOW = new Date("2026-11-28T09:00:00Z");
const day = (s: string) => new Date(`${s}T00:00:00Z`);

const row = (over: Partial<BannerRow> = {}): BannerRow => ({
  id: "b1",
  imageUrl: "https://pn.public.blob.vercel-storage.com/a.jpg",
  kind: "image",
  linkUrl: null,
  title: null,
  placement: "all",
  startsOn: null,
  endsOn: null,
  order: 0,
  ...over,
});

describe("хугацааны цонх", () => {
  it("хугацаагүй баннер ҮРГЭЛЖ гарна", () => {
    expect(visibleBanners([row()], "home", NOW)).toHaveLength(1);
  });

  it("эхлээгүй баннер гарахгүй", () => {
    expect(visibleBanners([row({ startsOn: day("2026-12-01") })], "home", NOW)).toHaveLength(0);
  });

  it("өнөөдөр эхэлсэн баннер гарна", () => {
    expect(visibleBanners([row({ startsOn: day("2026-11-28") })], "home", NOW)).toHaveLength(1);
  });

  it("дууссан баннер гарахгүй", () => {
    expect(visibleBanners([row({ endsOn: day("2026-11-27") })], "home", NOW)).toHaveLength(0);
  });

  it("ӨНӨӨДӨР дуусах баннер ӨНӨӨДӨР гарна — сүүлийн өдөр нь бүтэн", () => {
    expect(visibleBanners([row({ endsOn: day("2026-11-28") })], "home", NOW)).toHaveLength(1);
  });
});

describe("байршил — artifact-ийн adBlock дүрэм", () => {
  it("яг таарсан байршил", () => {
    expect(visibleBanners([row({ placement: "home" })], "home", NOW)).toHaveLength(1);
    expect(visibleBanners([row({ placement: "home" })], "article", NOW)).toHaveLength(0);
  });

  it("all нь хаана ч гарна", () => {
    for (const p of ["home", "article", "side"] as const) {
      expect(visibleBanners([row({ placement: "all" })], p, NOW)).toHaveLength(1);
    }
  });

  it("both нь нийтлэлд ГАРАХГҮЙ", () => {
    expect(visibleBanners([row({ placement: "both" })], "home", NOW)).toHaveLength(1);
    expect(visibleBanners([row({ placement: "both" })], "side", NOW)).toHaveLength(1);
    expect(visibleBanners([row({ placement: "both" })], "article", NOW)).toHaveLength(0);
  });

  it("танихгүй байршил нь хаана ч гарахгүй", () => {
    expect(visibleBanners([row({ placement: "хакер" })], "home", NOW)).toHaveLength(0);
  });
});

describe("холбоос ба медиа", () => {
  it("javascript: холбоос нь ХАСАГДАНА, зураг нь үлдэнэ", () => {
    const got = visibleBanners([row({ linkUrl: "javascript:alert(1)" })], "home", NOW);
    expect(got).toHaveLength(1);
    expect(got[0].link).toBeNull();
  });

  it("https холбоос үлдэнэ", () => {
    expect(visibleBanners([row({ linkUrl: "https://a.mn" })], "home", NOW)[0].link).toBe(
      "https://a.mn",
    );
  });

  it("зөвшөөрөгдөөгүй хостын медиа нь баннер үүсгэхгүй", () => {
    expect(visibleBanners([row({ imageUrl: "https://evil.mn/a.jpg" })], "home", NOW)).toHaveLength(0);
  });

  it("дарааллыг хадгална", () => {
    const got = visibleBanners(
      [row({ id: "b2", order: 1 }), row({ id: "b1", order: 0 })],
      "home",
      NOW,
    );
    expect(got.map((b) => b.id)).toEqual(["b2", "b1"]);
  });

  it("хадгалсан kind нь эрхтэй — өргөтгөлгүй CDN хаягт ч видео гэж мэднэ", () => {
    const got = visibleBanners(
      [row({ kind: "video", imageUrl: "https://pn.public.blob.vercel-storage.com/x" })],
      "home",
      NOW,
    );
    expect(got[0].kind).toBe("video");
  });

  it("танихгүй kind нь өргөтгөлөөр шийдэгдэнэ", () => {
    const got = visibleBanners(
      [row({ kind: "хог", imageUrl: "https://pn.public.blob.vercel-storage.com/a.mp4" })],
      "home",
      NOW,
    );
    expect(got[0].kind).toBe("video");
  });
});

describe("bannerKind", () => {
  it(".mp4 нь видео", () => expect(bannerKind("https://a.mn/x.mp4")).toBe("video"));
  it(".webm нь видео", () => expect(bannerKind("https://a.mn/x.webm?v=2")).toBe("video"));
  it("GIF нь ЗУРАГ — хөтөч өөрөө хөдөлгөнө", () =>
    expect(bannerKind("https://a.mn/x.gif")).toBe("image"));
  it("өргөтгөлгүй нь зураг", () => expect(bannerKind("https://a.mn/x")).toBe("image"));
});
