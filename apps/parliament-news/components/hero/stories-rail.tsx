import { orderStories } from "../../lib/stories";
import { imageOrCover } from "../../lib/images";
import { storyMedia } from "../../lib/story-media";
import { coverUrl, plainCoverUrl } from "../../lib/cover-input";
import { mnNumericDate } from "../../lib/format";
import { Icon } from "../icon";
import { StoryViewer, type StoryItem } from "./story-viewer";
import type { PostListItem } from "../../lib/posts";

/** Дугуй зургийн талбай — `.st i` нь 60px, 3px хүрээтэй */
const THUMB = 60;

/**
 * Стори зурвас — artifact-ийн `nav.stories` (index.html:604).
 *
 * Artifact-д товч бөгөөд бүтэн дэлгэцийн үзүүлэгч нээдэг. Энд ЖИНХЭНЭ
 * холбоос: JS ажиллахгүй бол дарахад мэдээ нээгдэнэ. JS байгаа үед
 * `StoryViewer` нь дарлтыг барьж аваад давхаргыг нээнэ.
 *
 * Үзүүлэгч нь ижил `items` массивыг авна — `data-sk` нь ЭРЭМБЭЛСЭН
 * жагсаалтын индекс, эх жагсаалтынх биш.
 */
export function StoriesRail({ stories }: { stories: PostListItem[] }) {
  if (stories.length === 0) return null;
  const items = orderStories(stories);

  const viewer: StoryItem[] = items.map((post) => {
    const media = storyMedia(post);
    return {
      slug: post.slug,
      title: post.title,
      lead: post.lead ?? "",
      category: post.categoryName,
      date: mnNumericDate(post.date),
      featured: post.featured,
      /**
       * Давхаргын дэвсгэр нь ТЕКСТГҮЙ хавтас: гарчгийг нь давхарга өөрөө
       * дээр нь хэвлэдэг. Зурвасын дугуй зураг нь бүтэн хавтас хэвээр —
       * тэнд текст нь 60px дотор ялгагдахгүй, зөвхөн өнгө, хээ харагдана.
       */
      src: media.src,
      video: media.video,
    };
  });

  return (
    <>
    <nav className="stories" id="stories" aria-label="Стори мэдээ">
      {items.map((post, k) => {
        const picked = imageOrCover(post.imageUrl);
        const src = picked.useImage ? picked.src : coverUrl(post.slug);
        return (
          <a
            className="st"
            key={post.slug}
            data-sk={k}
            href={`/news/${post.slug}`}
            aria-label={`Стори: ${post.title}`}
          >
            <i>
              <span>
                <img
                  src={src}
                  alt=""
                  width={THUMB}
                  height={THUMB}
                  loading="lazy"
                  decoding="async"
                />
              </span>
            </i>
            <small>
              {post.featured ? <Icon name="star" /> : null}
              {post.kicker || post.categoryName}
            </small>
          </a>
        );
      })}
    </nav>
    <StoryViewer stories={viewer} />
    </>
  );
}
