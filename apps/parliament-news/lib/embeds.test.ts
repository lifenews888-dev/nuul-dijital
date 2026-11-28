import { describe, it, expect } from "vitest";
import { parseEmbed } from "./embeds";

describe("YouTube", () => {
  it("watch хаягийг embed болгоно", () => {
    expect(parseEmbed("https://www.youtube.com/watch?v=abc123")?.src).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("youtu.be богино хаяг", () => {
    expect(parseEmbed("https://youtu.be/abc123")?.src).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("аль хэдийн embed бол хэвээр", () => {
    expect(parseEmbed("https://www.youtube.com/embed/abc123")?.src).toBe(
      "https://www.youtube.com/embed/abc123",
    );
  });

  it("видеоны дугаар байхгүй бол null", () => {
    expect(parseEmbed("https://www.youtube.com/")).toBeNull();
  });

  it("16/9 харьцаатай", () => {
    expect(parseEmbed("https://youtu.be/abc123")?.ratio).toBe("16/9");
  });
});

describe("X ба Facebook", () => {
  it("X-ийн status", () => {
    const e = parseEmbed("https://x.com/parliament/status/1790000000000000000");
    expect(e?.host).toBe("x");
    expect(e?.src).toContain("1790000000000000000");
  });

  it("хуучин twitter.com ч ажиллана", () => {
    expect(parseEmbed("https://twitter.com/a/status/12345")?.host).toBe("x");
  });

  it("status дугааргүй X хаяг нь null", () => {
    expect(parseEmbed("https://x.com/parliament")).toBeNull();
  });

  it("Facebook видео", () => {
    const e = parseEmbed("https://www.facebook.com/parliament/videos/123/");
    expect(e?.host).toBe("facebook");
    expect(e?.src).toContain(encodeURIComponent("https://www.facebook.com/parliament/videos/123/"));
  });
});

describe("хаалга", () => {
  it("танихгүй хост нь null", () => {
    expect(parseEmbed("https://evil.mn/a")).toBeNull();
  });

  it("хуурамч дэд домэйн нь null — youtube.com.evil.mn", () => {
    expect(parseEmbed("https://youtube.com.evil.mn/watch?v=a")).toBeNull();
  });

  it("javascript: протокол нь null", () => {
    expect(parseEmbed("javascript:alert(1)")).toBeNull();
  });

  it("http (найдваргүй) нь null", () => {
    expect(parseEmbed("http://www.youtube.com/watch?v=abc")).toBeNull();
  });

  it("хог мөр нь null, шидэхгүй", () => {
    expect(parseEmbed("энэ бол хаяг биш")).toBeNull();
    expect(parseEmbed("")).toBeNull();
  });
});
