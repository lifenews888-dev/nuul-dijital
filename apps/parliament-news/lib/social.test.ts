import { describe, it, expect } from "vitest";
import {
  CHANNELS,
  channelKey,
  queueableChannels,
  composeText,
  TEXT_MAX,
  canRetry,
  MAX_ATTEMPTS,
} from "./social";

describe("channelKey", () => {
  it("редакцын монгол нэрийг техникийн түлхүүр болгоно", () => {
    expect(channelKey("Facebook")).toBe("facebook");
    expect(channelKey("YouTube")).toBe("youtube");
    expect(channelKey("Instagram")).toBe("instagram");
    expect(channelKey("TikTok")).toBe("tiktok");
  });

  it("«Сайт» нь суваг БИШ — мэдээ сайтдаа аль хэдийн байна", () => {
    expect(channelKey("Сайт")).toBeNull();
  });

  it("танихгүй нэр нь null", () => {
    expect(channelKey("Хакер")).toBeNull();
  });

  it("том жижиг үсэг хамаарахгүй", () => {
    expect(channelKey("facebook")).toBe("facebook");
  });
});

describe("queueableChannels", () => {
  it("зөвхөн таних сувгуудыг, давхардалгүй", () => {
    expect(queueableChannels(["Сайт", "Facebook", "Facebook", "Хакер", "Telegram"])).toEqual([
      "facebook",
      "telegram",
    ]);
  });

  it("хоосон жагсаалт нь хоосон", () => {
    expect(queueableChannels([])).toEqual([]);
  });

  it("зөвхөн «Сайт» сонгосон бол дараалалд юу ч орохгүй", () => {
    expect(queueableChannels(["Сайт"])).toEqual([]);
  });
});

describe("composeText", () => {
  const url = "https://parlamentnews.mn/news/tosov";

  it("гарчиг, товч агуулга, холбоос", () => {
    const got = composeText({ title: "Төсөв батлагдлаа", lead: "Товч тайлбар", url });
    expect(got).toContain("Төсөв батлагдлаа");
    expect(got).toContain("Товч тайлбар");
    expect(got.endsWith(url)).toBe(true);
  });

  it("товч агуулгагүй бол гарчиг ба холбоос", () => {
    const got = composeText({ title: "Гарчиг", lead: null, url });
    expect(got).toBe(`Гарчиг\n\n${url}`);
  });

  it("хэт урт бол ТОВЧ АГУУЛГЫГ таслана, холбоос бүтэн үлдэнэ", () => {
    const got = composeText({ title: "Гарчиг", lead: "у".repeat(5000), url });
    expect(got.length).toBeLessThanOrEqual(TEXT_MAX);
    expect(got.endsWith(url)).toBe(true);
  });

  it("гарчиг нь дангаараа хэт урт байсан ч холбоос үлдэнэ", () => {
    const got = composeText({ title: "Г".repeat(5000), lead: null, url });
    expect(got.endsWith(url)).toBe(true);
    expect(got.length).toBeLessThanOrEqual(TEXT_MAX);
  });
});

describe("canRetry", () => {
  it("алдаатай, оролдлого дуусаагүй бол дахин", () => {
    expect(canRetry({ status: "FAILED", attempts: 1 })).toBe(true);
  });

  it("оролдлого дууссан бол үгүй — хязгааргүй давталт хийхгүй", () => {
    expect(canRetry({ status: "FAILED", attempts: MAX_ATTEMPTS })).toBe(false);
  });

  it("илгээгдсэн нь дахин илгээгдэхгүй", () => {
    expect(canRetry({ status: "SENT", attempts: 0 })).toBe(false);
  });

  it("дараалалд байгаа нь илгээгдэнэ", () => {
    expect(canRetry({ status: "QUEUED", attempts: 0 })).toBe(true);
  });
});

describe("CHANNELS", () => {
  it("редакцын сонголттой таарна", () => {
    expect(CHANNELS.map((c) => c.label)).toEqual([
      "Facebook",
      "YouTube",
      "Instagram",
      "TikTok",
      "Telegram",
    ]);
  });
});
