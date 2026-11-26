import { orderStories } from "../../lib/stories";
import { imageOrCover } from "../../lib/images";
import { coverUrl } from "../../lib/cover-input";
import { Icon } from "../icon";
import type { PostListItem } from "../../lib/posts";

/** Дугуй зургийн талбай — `.st i` нь 60px, 3px хүрээтэй */
const THUMB = 60;

/**
 * Стори зурвас — artifact-ийн `nav.stories` (index.html:604).
 *
 * Artifact-д товч бөгөөд бүтэн дэлгэцийн үзүүлэгч нээдэг. Энд холбоос:
 * үзүүлэгч нь Task 8-д орох хүртэл дарахад мэдээ нээгдэнэ, JS унтарсан ч
 * ажиллана.
 */
export function StoriesRail({ stories }: { stories: PostListItem[] }) {
  if (stories.length === 0) return null;
  const items = orderStories(stories);

  return (
    <nav className="stories" id="stories" aria-label="Стори мэдээ">
      {items.map((post) => {
        const picked = imageOrCover(post.imageUrl);
        const src = picked.useImage ? picked.src : coverUrl(post.slug);
        return (
          <a
            className="st"
            key={post.slug}
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
  );
}
