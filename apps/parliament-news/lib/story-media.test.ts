import { describe, it, expect } from "vitest";
import { storyMedia, type StorySource } from "./story-media";

const BLOB = "https://pn.public.blob.vercel-storage.com";
const post = (over: Partial<StorySource> = {}): StorySource => ({
  slug: "tosov",
  storyUrl: null,
  imageUrl: null,
  ...over,
});

describe("storyMedia", () => {
  it("босоо медиа байвал ТҮҮНИЙГ", () => {
    expect(storyMedia(post({ storyUrl: `${BLOB}/s.mp4`, imageUrl: `${BLOB}/i.jpg` }))).toEqual({
      src: `${BLOB}/s.mp4`,
      video: true,
    });
  });

  it("босоо зураг ч болно", () => {
    expect(storyMedia(post({ storyUrl: `${BLOB}/s.jpg` }))).toEqual({
      src: `${BLOB}/s.jpg`,
      video: false,
    });
  });

  it("босоо медиа байхгүй бол мэдээний зураг", () => {
    expect(storyMedia(post({ imageUrl: `${BLOB}/i.jpg` }))).toEqual({
      src: `${BLOB}/i.jpg`,
      video: false,
    });
  });

  it("аль нь ч байхгүй бол ТЕКСТГҮЙ хавтас", () => {
    expect(storyMedia(post())).toEqual({ src: "/cover/tosov/plain", video: false });
  });

  it("зөвшөөрөгдөөгүй хостын босоо медиа нь хавтас руу эргэнэ", () => {
    expect(storyMedia(post({ storyUrl: "https://evil.mn/s.mp4" })).src).toBe("/cover/tosov/plain");
  });

  it("зөвшөөрөгдөөгүй зураг ч мөн адил", () => {
    expect(storyMedia(post({ imageUrl: "https://evil.mn/i.jpg" })).src).toBe("/cover/tosov/plain");
  });

  it("slug нь хаягт кодчилогдоно", () => {
    expect(storyMedia(post({ slug: "а б" })).src).toBe("/cover/%D0%B0%20%D0%B1/plain");
  });
});
