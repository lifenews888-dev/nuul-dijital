import Link from "next/link";
import { mnDate } from "../lib/format";
import type { PostListItem } from "../lib/posts";
import { imageOrCover } from "../lib/images";
import { PostImage } from "./post-image";
import { PostCoverImage } from "./post-cover";

/**
 * Жагсаалтын нэгж. Нүүр, ангилал, таг, хайлт дөрвүүлэнд үйлчилнэ — дөрвөн
 * ижил карт бичихгүй.
 *
 * `feature` нь нүүрний том блокт, `list` нь энгийн жагсаалтад.
 */
export function PostCard({
  post,
  variant = "list",
}: {
  post: PostListItem;
  variant?: "feature" | "list";
}) {
  const feature = variant === "feature";
  // Зураг нь үйлчлэгдэх боломжтой эсэхээр салаална, БАЙГАА эсэхээр биш —
  // зөвшөөрөөгүй host-ын зураг хоосон хайрцаг үлдээхгүй, хавтас руу эргэнэ.
  const media = imageOrCover(post.imageUrl);

  return (
    <article className={feature ? "" : "border-t border-rule/15 pt-4"}>
      <Link href={`/news/${post.slug}`} className="group block">
        {/*
          Тогтсон 3:2 хайрцаг: демо зураг нь босоо ч, хэвтээ ч байж болох тул
          хайрцаггүй бол тор эвдэрнэ. Фото нь `cover`-оор тайрагдана; хавтас
          нь 474×900 босоо учир дээд талыг нь үзүүлнэ — тэнд нэр, ангилал,
          motif байгаа, хамгийн таних хэсэг нь.
        */}
        <div className="aspect-[3/2] overflow-hidden bg-sheet">
          {media.useImage ? (
            <PostImage
              src={media.src}
              alt={post.title}
              variant="card"
              className="h-full w-full object-cover"
            />
          ) : (
            <PostCoverImage post={post} className="h-full w-full object-cover object-top" />
          )}
        </div>

        {post.kicker ? (
          <p className="mt-3 font-head text-[0.7rem] font-bold uppercase tracking-widest text-red">
            {post.kicker}
          </p>
        ) : null}

        <h2
          className={`mt-1 font-head font-extrabold leading-tight tracking-tight group-hover:text-cob ${
            feature ? "text-2xl" : "text-lg"
          }`}
        >
          {post.title}
        </h2>

        {feature && post.lead ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">{post.lead}</p>
        ) : null}
      </Link>

      <p className="mt-2 font-head text-xs text-muted">
        {post.categorySlug ? (
          <Link href={`/c/${post.categorySlug}`} className="hover:text-cob">
            {post.categoryName}
          </Link>
        ) : (
          post.categoryName
        )}
        <span aria-hidden="true"> · </span>
        <time dateTime={post.publishedAt.toISOString()}>{mnDate(post.date)}</time>
      </p>
    </article>
  );
}
