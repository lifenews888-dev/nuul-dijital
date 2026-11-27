import { describe, it, expect } from "vitest";
import {
  checkUpload,
  IMAGE_TYPES,
  VIDEO_TYPES,
  IMAGE_MAX,
  VIDEO_MAX,
  allowedTypes,
  maxBytes,
} from "./upload";

/**
 * Review Focus #4 — байршуулалт дурын файл авч болохгүй.
 *
 * Blob нь өөрийн домэйнаас файлыг ШУУД үйлчилдэг. `.svg` эсвэл `.html`
 * тэнд очвол тэр домэйн дээр script ажиллана; cookie нь өөр домэйнийх
 * тул сесс хулгайлахгүй ч, манай брэндийн хаягаар фишинг хуудас
 * байршуулах боломж нээгдэнэ.
 *
 * Хэмжээний хязгааргүй бол нэг хүн квотыг дүүргэж, бусад редакторын
 * ажлыг зогсооно.
 */
describe("checkUpload — төрөл", () => {
  it("SVG-г ТАТГАЛЗАНА — script ажиллуулна", () => {
    expect(checkUpload({ type: "image/svg+xml", size: 100 }, "image").ok).toBe(false);
  });

  it("HTML-ийг татгалзана", () => {
    expect(checkUpload({ type: "text/html", size: 100 }, "image").ok).toBe(false);
  });

  it("төрөлгүй файлыг татгалзана", () => {
    expect(checkUpload({ type: "", size: 100 }, "image").ok).toBe(false);
  });

  it("зөв зургийг авна", () => {
    for (const type of IMAGE_TYPES) {
      expect(checkUpload({ type, size: 1000 }, "image").ok, type).toBe(true);
    }
  });

  it("зөв видеог авна", () => {
    for (const type of VIDEO_TYPES) {
      expect(checkUpload({ type, size: 1000 }, "video").ok, type).toBe(true);
    }
  });

  it("видеог зургийн суваг руу оруулахгүй", () => {
    expect(checkUpload({ type: "video/mp4", size: 1000 }, "image").ok).toBe(false);
  });

  it("зургийг видеоны суваг руу оруулахгүй", () => {
    expect(checkUpload({ type: "image/jpeg", size: 1000 }, "video").ok).toBe(false);
  });

  it("төрлийн параметрийг тоохгүй — `image/jpeg; charset=x`", () => {
    expect(checkUpload({ type: "image/jpeg; charset=utf-8", size: 100 }, "image").ok).toBe(true);
  });

  it("том жижиг үсгийг үл ялгана", () => {
    expect(checkUpload({ type: "IMAGE/JPEG", size: 100 }, "image").ok).toBe(true);
  });
});

describe("checkUpload — хэмжээ", () => {
  it("хэт том зургийг татгалзана", () => {
    expect(checkUpload({ type: "image/jpeg", size: IMAGE_MAX + 1 }, "image").ok).toBe(false);
  });

  it("яг хязгаар дээрхийг авна", () => {
    expect(checkUpload({ type: "image/jpeg", size: IMAGE_MAX }, "image").ok).toBe(true);
  });

  it("хэт том видеог татгалзана", () => {
    expect(checkUpload({ type: "video/mp4", size: VIDEO_MAX + 1 }, "video").ok).toBe(false);
  });

  it("хоосон файлыг татгалзана", () => {
    expect(checkUpload({ type: "image/jpeg", size: 0 }, "image").ok).toBe(false);
  });
});

describe("шалтгаан", () => {
  it("монголоор, юу буруу болохыг хэлнэ", () => {
    const bad = checkUpload({ type: "image/svg+xml", size: 1 }, "image");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.reason).toMatch(/зөвшөөрөгдөхгүй/);

    const big = checkUpload({ type: "image/jpeg", size: IMAGE_MAX + 1 }, "image");
    if (!big.ok) expect(big.reason).toMatch(/МБ/);
  });
});

describe("blob-ийн тохиргоонд дамжуулах утгууд", () => {
  it("төрлийн жагсаалт", () => {
    expect(allowedTypes("image")).toEqual(IMAGE_TYPES);
    expect(allowedTypes("video")).toEqual(VIDEO_TYPES);
  });

  it("хэмжээний хязгаар", () => {
    expect(maxBytes("image")).toBe(IMAGE_MAX);
    expect(maxBytes("video")).toBe(VIDEO_MAX);
  });

  /** SVG нь жагсаалтад БАЙХ ЁСГҮЙ — blob өөрөө ч татгалзана */
  it("зөвшөөрөгдсөн жагсаалтад SVG алга", () => {
    expect(IMAGE_TYPES).not.toContain("image/svg+xml");
  });
});
