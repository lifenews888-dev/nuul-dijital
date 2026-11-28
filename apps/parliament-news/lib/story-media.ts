import { safeImageSrc } from "./images";
import { plainCoverUrl } from "./cover-input";
import { bannerKind } from "./banner";

/**
 * Сторины медиа — БОСОО (9:16) эхэнд.
 *
 * Гурван шат: редакцын тусгай босоо медиа → мэдээний зураг → текстгүй
 * хавтас. Эхний нь байхгүй үед хэвтээ зураг босоо хүрээнд тайрагдаж,
 * ихэвчлэн хүний толгой тасардаг — тиймээс `NewsPost.storyUrl` тусдаа
 * багана: нийтлэлийн зураг, сторины бичлэг хоёр ӨӨР зүйл.
 */
export type StorySource = {
  slug: string;
  storyUrl: string | null;
  imageUrl: string | null;
};

export type StoryMedia = { src: string; video: boolean };

export function storyMedia(post: StorySource): StoryMedia {
  const story = safeImageSrc(post.storyUrl);
  if (story) return { src: story, video: bannerKind(story) === "video" };

  const image = safeImageSrc(post.imageUrl);
  if (image) return { src: image, video: false };

  return { src: plainCoverUrl(post.slug), video: false };
}
